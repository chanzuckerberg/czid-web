# This is a class of static helper methods to run SQL queries over elasticsearch rest APIs
# This class is used in heatmap_helper to generate the data
module ElasticsearchQueryHelper
  require 'ostruct'

  LAMBDA_ENV = Rails.env.development? || Rails.env.test? ? "staging" : Rails.env

  config = { host: ENV["HEATMAP_ES_ADDRESS"], transport_options: { request: { timeout: 200 } } }
  ES_CLIENT = Elasticsearch::Client.new(config) unless Rails.env.test?

  LAMBDA_CLIENT = Aws::Lambda::Client.new(
    http_read_timeout: 1000, # more than the 900 second limit on lambda executions
    retry_limit: 0 # TODO: retry on networking error?
  )

  DEFAULT_QUERY_FETCH_SIZE = 100

  METRICS_MAPPING = {
    r: "counts",
    percentidentity: "percent_identity",
    alignmentlength: "alignment_length",
    logevalue: "e_value",
    rpm: "rpm",
    zscore: "zscore",
  }.freeze

  # Check is the data exists in ES for background_id and pipeline_run_ids if not then invoke taxon-indexing lambda job
  # to calculate and save scores in the ES index
  def self.update_es_for_missing_data(background_id, pipeline_run_ids)
    missing_pipeline_run_ids = find_pipeline_runs_missing_from_es(
      background_id,
      pipeline_run_ids
    )
    if missing_pipeline_run_ids.present?
      call_taxon_indexing_lambda(
        background_id,
        missing_pipeline_run_ids
      )
    end
  end

  # updates the last_read_at timestamp in the pipeline_runs index
  # for use by the scheduled LRU eviction lambda
  def self.update_last_read_at(background_id, pipeline_run_ids)
    current_timestamp = Time.now.utc.iso8601(6)
    bulk_body = pipeline_run_ids.map do |pipeline_run_id|
      {
        update: {
          _index: "pipeline_runs",
          _id: "#{pipeline_run_id}_#{background_id}",
          data: {
            "doc": {
              last_read_at: current_timestamp,
            },
          },
        },
      }
    end

    begin
      response = ES_CLIENT.bulk(body: bulk_body)
      if response['errors']
        LogUtil.log_message("Some bulk updates of last_read_at failed for #{pipeline_run_ids}_#{background_id}", details: response['items'])
      end
    rescue StandardError => error
      LogUtil.log_error("Failed to submit bulk update of last_read_at for #{pipeline_run_ids}_#{background_id}", exception: error)
    end
  end

  def self.divergent_pathogens_for_pipeline_runs(
    pipeline_run_ids,
    background_id
  )
    # see https://docs.google.com/document/d/1QxjdvI3s-VAOW6NbTQGzfFImoWOo9k56G7XTyOcS7gY/edit for requirements
    search_body = {
      "_source": [
        "pipeline_run_id",
        "tax_id",
      ],
      "size": 10_000,
      "query": {
        "bool": {
          "filter": [
            # taxons from samples the user selected
            {
              "terms": {
                "pipeline_run_id": pipeline_run_ids,
              },
            },
            {
              "term": {
                "background_id": background_id || Rails.configuration.x.constants.default_background,
              },
            },
            # only viruses
            {
              "term": {
                "superkingdom_taxid": ReportHelper::CATEGORIES_TAXID_BY_NAME["Viruses"],
              },
            },
            # not phages
            {
              "term": {
                "is_phage": 0,
              },
            },
            # all other metric-based conditions
            {
              "nested": {
                "path": "metric_list",
                "query": {
                  "bool": {
                    "filter": [
                      {
                        "term": {
                          "metric_list.count_type": "NR",
                        },
                      },
                      {
                        "range": {
                          "metric_list.contigs": {
                            "gte": 1,
                          },
                        },
                      },
                      {
                        "range": {
                          "metric_list.percent_identity": {
                            "lte": 80,
                          },
                        },
                      },
                      {
                        "range": {
                          "metric_list.alignment_length": {
                            "gte": 50,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      # sort parameters required for pagination
      "sort": [
        {
          "tax_id": {
            "order": "asc",
          },
        },
        {
          "pipeline_run_id": {
            "order": "asc",
          },
        },
        {
          "background_id": {
            "order": "asc",
          },
        },
      ],
    }

    hits = paginate_all_results("scored_taxon_counts", search_body)
    return hits
  end

  def self.lcrp_top_15_for_pipeline_runs(
    pipeline_run_ids,
    background_id
  )
    search_body = {
      "_source": false,
      "size": 0, # we get all results from aggregations so no top-level results required
      "query": {
        "bool": {
          "filter": [
            # taxons from samples the user selected
            {
              "terms": {
                "pipeline_run_id": pipeline_run_ids,
              },
            },
            {
              "term": {
                # if background not provided, use the default background record. zscore is ignored below.
                "background_id": background_id || Rails.configuration.x.constants.default_background,
              },
            },
            # no taxa with neither family nor genus classification
            {
              "range": {
                "tax_id": {
                  "gte": "0",
                },
              },
            },
            # all other metric-based conditions
            {
              "nested": {
                "path": "metric_list",
                "query": {
                  "bool": {
                    "filter": [
                      {
                        "term": {
                          "metric_list.count_type": "NT",
                        },
                      },
                      {
                        "range": {
                          "metric_list.alignment_length": {
                            "gt": 50,
                          },
                        },
                      },
                      {
                        "exists": {
                          "field": "metric_list.rpm",
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              "nested": {
                "path": "metric_list",
                "query": {
                  "bool": {
                    "filter": [
                      {
                        "term": {
                          "metric_list.count_type": "NR",
                        },
                      },
                      {
                        "range": {
                          "metric_list.counts": {
                            "gt": 0,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      "aggs": {
        "pipeline_runs": {
          "terms": {
            "field": "pipeline_run_id",
            "size": pipeline_run_ids.length(),
          },
          "aggs": {
            "top_taxons_by_rpm": {
              "top_hits": {
                "sort": [
                  {
                    "metric_list.rpm": {
                      "order": "DESC",
                      "nested": {
                        "path": "metric_list",
                        "filter": {
                          "term": {
                            "metric_list.count_type": "NT",
                          },
                        },
                      },
                    },
                  },
                ],
                "_source": true,
                "size": 15,
              },
            },
          },
        },
      },
    }

    response = ES_CLIENT.search(index: "scored_taxon_counts", body: search_body)
    return response
  end

  def self.lcrp_viral_pathogens_for_pipeline_runs(
    pipeline_run_ids,
    background_id,
    known_pathogens
  )
    # see https://docs.google.com/document/d/1h7Dtwy1_ipQao7NUfQsmuOEXqL7fouI_fhaRi4j-i24/edit?usp=sharing for requirements
    search_body = {
      "_source": [
        "pipeline_run_id",
        "tax_id",
      ],
      "size": 10_000,
      "query": {
        "bool": {
          "filter": [
            # taxons from samples the user selected
            {
              "terms": {
                "pipeline_run_id": pipeline_run_ids,
              },
            },
            {
              "term": {
                "background_id": background_id || Rails.configuration.x.constants.default_background,
              },
            },
            # only viruses
            {
              "term": {
                "superkingdom_taxid": ReportHelper::CATEGORIES_TAXID_BY_NAME["Viruses"],
              },
            },
            # only known pathogens
            {
              "terms": {
                "tax_id": known_pathogens,
              },
            },
            # no taxa with neither family nor genus classification
            {
              "range": {
                "tax_id": {
                  "gte": "0",
                },
              },
            },
            # all other metric-based conditions
            {
              "nested": {
                "path": "metric_list",
                "query": {
                  "bool": {
                    "filter": [
                      {
                        "term": {
                          "metric_list.count_type": "NT",
                        },
                      },
                      *(
                        unless background_id.nil?
                          [
                            "range": {
                              "metric_list.zscore": {
                                "gt": 2,
                              },
                            },
                          ]
                        end
                      ),
                      {
                        "range": {
                          "metric_list.alignment_length": {
                            "gt": 50,
                          },
                        },
                      },
                      {
                        "range": {
                          "metric_list.rpm": {
                            "gt": 1,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              "nested": {
                "path": "metric_list",
                "query": {
                  "bool": {
                    "filter": [
                      {
                        "term": {
                          "metric_list.count_type": "NR",
                        },
                      },
                      {
                        "range": {
                          "metric_list.rpm": {
                            "gt": 1,
                          },
                        },
                      },
                      {
                        "range": {
                          "metric_list.counts": {
                            "gt": 0,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      # sort parameters required for pagination
      "sort": [
        {
          "tax_id": {
            "order": "asc",
          },
        },
        {
          "pipeline_run_id": {
            "order": "asc",
          },
        },
        {
          "background_id": {
            "order": "asc",
          },
        },
      ],
    }

    hits = paginate_all_results("scored_taxon_counts", search_body)
    return hits
  end

  def self.known_pathogens_for_pipeline_runs(
    pipeline_run_ids,
    background_id,
    known_pathogens
  )
    # see https://docs.google.com/document/d/1h7Dtwy1_ipQao7NUfQsmuOEXqL7fouI_fhaRi4j-i24/edit?usp=sharing for requirements
    search_body = {
      "_source": [
        "pipeline_run_id",
        "tax_id",
      ],
      "size": 10_000,
      "query": {
        "bool": {
          "filter": [
            # taxons from samples the user selected
            {
              "terms": {
                "pipeline_run_id": pipeline_run_ids,
              },
            },
            {
              "term": {
                "background_id": background_id || Rails.configuration.x.constants.default_background,
              },
            },
            # only known pathogens
            {
              "terms": {
                "tax_id": known_pathogens,
              },
            },
          ],
        },
      },
      # sort parameters required for pagination
      "sort": [
        {
          "tax_id": {
            "order": "asc",
          },
        },
        {
          "pipeline_run_id": {
            "order": "asc",
          },
        },
        {
          "background_id": {
            "order": "asc",
          },
        },
      ],
    }

    hits = paginate_all_results("scored_taxon_counts", search_body)
    return hits
  end

  def self.paginate_all_results(index, search_body, search_after = nil)
    # https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
    # requires that a sort parameter has been provided
    if search_body[:sort].nil?
      raise "search_body must include a sort parameter when paginating results"
    end

    unless search_after.nil?
      search_body["search_after"] = search_after
    end
    result = ES_CLIENT.search(index: index, body: search_body)

    hits = result["hits"]["hits"]
    # if no results are returned, we have hit the end of the results and stop recursing
    if hits.empty?
      return hits
    end

    # for the last record of the result, get the property that was used to determine it's rank
    # It will be passed to "search_after" so ES knows where to start the next page
    search_after = hits.last["sort"]
    # recurse to fetch the remaining pages
    next_page_hits = paginate_all_results(index, search_body, search_after)

    # combine all page results
    return hits.concat(next_page_hits)
  end

  # Based on the provided filter criteria, query ES index and return top N taxon for each sample
  # reduce the returned tax_ids to a unique set and return
  def self.top_n_taxa_per_sample(
    filter_param,
    pipeline_run_ids
  )
    sort_params = ReportHelper.decode_sort_by(filter_param[:sort_by])

    base_query_filter_clause = [
      {
        "terms": {
          "pipeline_run_id": pipeline_run_ids,
        },
      },
      {
        "term": {
          "background_id": filter_param[:background_id].to_s,
        },
      },
      {
        "term": {
          "tax_level": filter_param[:taxon_level].to_s,
        },
      },
    ]

    base_query_must_not_clause = [
      {
        "term": {
          "genus_taxid": "-201",
        },
      },
    ]

    threshold_filters_clause = build_threshold_filters_clause(filter_param[:threshold_filters]) # includes the mandatory count > 5 filter
    categories_filter_clause = build_categories_filter_clause(filter_param[:categories], filter_param[:include_phage])
    read_specificity_filter_clause = build_read_specificity_filter_clause(filter_param[:read_specificity])
    taxon_tags_filter_clause = build_taxon_tags_filter_clause(filter_param[:taxon_tags])

    search_body = {
      "_source": false,
      "size": 0, # all results are pulled from aggregations so no top-level results required
      "query": {
        "bool": {
          "filter": base_query_filter_clause + threshold_filters_clause + categories_filter_clause + read_specificity_filter_clause + taxon_tags_filter_clause,
          "must_not": base_query_must_not_clause,
        },
      },
      "aggs": {
        "pipeline_runs": {
          "terms": {
            "field": "pipeline_run_id",
            "size": pipeline_run_ids.size,
          },
          "aggs": {
            "top_taxa": {
              "top_hits": {
                "size": filter_param[:taxons_per_sample],
                "sort": [
                  {
                    "metric_list.#{METRICS_MAPPING[:"#{sort_params[:metric]}"]}": {
                      "order": sort_params[:direction] == 'highest' ? 'DESC' : 'ASC',
                      "nested": {
                        "path": "metric_list",
                        "filter": {
                          "term": {
                            "metric_list.count_type": sort_params[:count_type],
                          },
                        },
                      },
                    },
                  },
                ],
                "_source": [
                  "tax_id",
                ],
              },
            },
          },
        },
      },
    }

    response = ES_CLIENT.search(index: "scored_taxon_counts", body: search_body)
    return parse_top_n_taxa_per_sample_response(response)
  end

  def self.batch_tax_ids(
    pipeline_run_ids,
    tax_ids
  )
    # if we have more than 10_000 pipeline_runs (samples) we will need to reconsider this paging strategy
    if pipeline_run_ids.size > 10_000
      raise "too many samples/pipelines given. Select 10000 or fewer."
    end

    # termination condition
    if (tax_ids.size * pipeline_run_ids.size) <= 10_000
      return [tax_ids]
    end

    # split the tax_ids in half and recurse to consider for further splitting
    left, right = tax_ids.each_slice((tax_ids.size / 2.0).round).to_a
    left_batches = batch_tax_ids(pipeline_run_ids, left)
    right_batches = batch_tax_ids(pipeline_run_ids, right)
    return left_batches + right_batches
  end

  # get all of the metrics for the given pipeline_run_ids X tax_ids
  def self.all_metrics_per_sample_and_taxa(
    pipeline_run_ids,
    tax_ids,
    background
  )
    tax_id_batches = batch_tax_ids(pipeline_run_ids, tax_ids)

    results = []
    # currently we will only have multiple batches if taxa_per_sample == 100 and there are more than 100 samples selected
    # if multiple batches becomes more common we should consider parallelizing these requests
    tax_id_batches.each do |tax_id_batch|
      results += fetch_all_metrics_per_sample_and_taxa(
        pipeline_run_ids,
        tax_id_batch,
        background
      )
    end
    return results
  end

  # get all of the metrics for the given pipeline_run_ids X tax_ids
  def self.fetch_all_metrics_per_sample_and_taxa(
    pipeline_run_ids,
    tax_ids,
    background
  )

    search_body = {
      "_source": true,
      "size": 10_000, # the number of results will not be higher than 10_000 thanks to batch_tax_ids()
      "query": {
        "bool": {
          "filter": [
            {
              "terms": {
                "pipeline_run_id": pipeline_run_ids,
              },
            },
            {
              "terms": {
                "tax_id": tax_ids,
              },
            },
            {
              "term": {
                "background_id": background,
              },
            },
          ],
        },
      },
    }

    response = ES_CLIENT.search(index: "scored_taxon_counts", body: search_body)
    return parse_es_response(response)
  end

  def self.find_complete_pipeline_runs(background_id, pipeline_run_ids)
    # ES won't return pages larger than 10_000. Since the query will at most return the number of pipeline_run_ids
    # that we pass in, we can pre-batch the queries so that they will always be under 10_000
    if pipeline_run_ids.size > 10_000
      split_index = pipeline_run_ids.size / 2
      left_half_complete_pipeline_runs = find_complete_pipeline_runs(background_id, pipeline_run_ids[0..(split_index - 1)])
      right_half_complete_pipeline_runs = find_complete_pipeline_runs(background_id, pipeline_run_ids[split_index..-1])
      return left_half_complete_pipeline_runs + right_half_complete_pipeline_runs
    end

    search_body = {
      "_source": "pipeline_run_id",
      "size": 10_000, # the number of results will not be higher than 10_000 thanks to the batching done above
      "query": {
        "bool": {
          "filter": [
            {
              "terms": {
                "pipeline_run_id": pipeline_run_ids,
              },
            },
            {
              "term": {
                "background_id": background_id,
              },
            },
            {
              "term": {
                "is_complete": true,
              },
            },
          ],
        },
      },
    }

    response = ES_CLIENT.search(index: "pipeline_runs", body: search_body)
    complete_pipeline_runs = response["hits"]["hits"].map { |doc| doc["_source"]["pipeline_run_id"] }
    return complete_pipeline_runs
  end

  # Query ES index to check if background and pipeline run ids are present
  def self.find_pipeline_runs_missing_from_es(background_id, pipeline_run_ids)
    if pipeline_run_ids.empty?
      return []
    end

    pipelines_in_es = find_complete_pipeline_runs(background_id, pipeline_run_ids)
    missing_pipeline_run_ids = pipeline_run_ids - pipelines_in_es.flatten
    return missing_pipeline_run_ids.flatten
  end

  def self.invoke_lambda(function_name, payload)
    if ENV['INDEXING_LAMBDA_MODE'] == 'local'
      local_lambda_host = {
        "taxon-indexing-concurrency-manager-#{LAMBDA_ENV}" => ENV['LOCAL_TAXON_INDEXING_URL'],
        "taxon-indexing-eviction-lambda-#{LAMBDA_ENV}-evict_selected_taxons" => ENV['LOCAL_EVICTION_URL'],
      }[function_name]
      begin
        response = HTTP.post("http://#{local_lambda_host}/2015-03-31/functions/function/invocations", json: payload)
        return OpenStruct.new({
                                "status_code": response.code,
                                "payload": OpenStruct.new({
                                                            "string": response.body,
                                                          }),
                              })
      rescue StandardError => error
        raise "Lambda invocation failure: #{error}"
      end
    else
      return LAMBDA_CLIENT.invoke({
                                    function_name: function_name,
                                    invocation_type: 'RequestResponse',
                                    log_type: "None",
                                    payload: JSON.generate(payload),
                                  })
    end
  end

  def self.call_lambda(function_name, payload)
    begin
      attempts ||= 1
      resp = invoke_lambda(function_name, payload)
      if resp["status_code"] != 200 || !resp["function_error"].nil?
        raise "#{function_name} invocation failed with status_code: #{resp['status_code']}, function_error: #{resp.payload.string}"
      end
    rescue StandardError => error
      LogUtil.log_error("#{function_name} invocation failure", exception: error)
      if (attempts += 1) <= 2
        sleep(3.seconds)
        retry
      end
      raise error
    end
    return resp
  end

  def self.call_taxon_indexing_lambda(background_id, pipeline_run_ids)
    function_name = "taxon-indexing-concurrency-manager-#{LAMBDA_ENV}"
    payload = {
      background_id: background_id,
      pipeline_run_ids: pipeline_run_ids,
    }
    resp = call_lambda(function_name, payload)

    resp_payload = JSON.parse(resp.payload.string)
    failure_count = resp_payload.count { |invocation| invocation["FunctionError"] }
    # check if any indexing jobs failed. If they did, raise an error to the user so that
    # they can retry. All indexing jobs must succeed before the heatmap can be rendered.
    if failure_count > 0
      LogUtil.log_error("Some taxon indexing jobs failed", exception: resp_payload)
      raise "Some taxon indexing jobs failed: #{resp_payload}"
    end
  end

  def self.call_taxon_eviction_lambda(pipeline_run_ids)
    ## if the delete fails, partially or completely, an error will be raised by `call_lambda`
    # if the delete succeeds, we will have a response of the structure:
    # {
    #   "eviction_type"=>"selected", # the type of eviction that was performed
    #   "eviction_candidates"=>[ # the list of pipeline_run_ids/background_ids that were evicted
    #     {
    #       "pipeline_run_id"=>29202,
    #       "background_id"=>1
    #     }
    #   ],
    #   "selected_pipeline_run_ids"=>[29202] # the list of pipeline_run_ids that were passed in
    # }
    function_name = "taxon-indexing-eviction-lambda-#{LAMBDA_ENV}-evict_selected_taxons"
    payload = {
      pipeline_run_ids: pipeline_run_ids,
    }
    resp = call_lambda(function_name, payload)

    return JSON.parse(resp.payload.string)
  end

  def self.build_categories_filter_clause(categories, include_phage)
    categories_filter_clause = []

    if categories.present?
      categories = categories.map { |category| ReportHelper::CATEGORIES_TAXID_BY_NAME[category] }.compact
      categories_filter_clause << {
        "terms": {
          "superkingdom_taxid": categories,
        },
      }
    elsif include_phage
      categories_filter_clause << {
        "term": {
          "superkingdom_taxid": (ReportHelper::CATEGORIES_TAXID_BY_NAME["Viruses"]).to_s,
        },
      }
    end

    # create the is_phage filter here as well as this is determined by the categories selected
    phage_clause = []
    if !include_phage && categories.present?
      # explicitly filter out phages
      phage_clause << {
        "term": {
          "is_phage": 0,
        },
      }
    elsif include_phage && categories.blank?
      # only fetch phages
      phage_clause << {
        "term": {
          "is_phage": 1,
        },
      }
    end

    categories_filter_clause + phage_clause
  end

  def self.build_read_specificity_filter_clause(read_specificity)
    read_specificity_filter_clause = []
    if read_specificity == 1
      read_specificity_filter_clause << {
        "range": {
          "tax_id": {
            "gte": "0",
          },
        },
      }
      read_specificity_filter_clause << {
        "range": {
          "genus_taxid": {
            "gte": "0",
          },
        },
      }
    end
    read_specificity_filter_clause
  end

  # clause for the threshold filters provided by the user (and the mandatory count > 1)
  def self.build_threshold_filters_clause(
    threshold_filters
  )
    threshold_filters_clause = []
    nt_nested_clause = build_nested_threshold_filter_clause("NT", threshold_filters)
    nr_nested_clause = build_nested_threshold_filter_clause("NR", threshold_filters)

    threshold_filters_clause << nt_nested_clause
    threshold_filters_clause << nr_nested_clause
    return threshold_filters_clause.compact
  end

  def self.build_taxon_tags_filter_clause(
    taxon_tags
  )
    if taxon_tags&.include?("known_pathogen")
      pathogen_tax_ids = PathogenList.find_by(is_global: true).fetch_list_version().fetch_pathogens_info().pluck(:tax_id)
      return [
        {
          "terms": {
            "tax_id": pathogen_tax_ids,
          },
        },
      ]
    else
      return []
    end
  end

  # Build nested query clause to apply threshold filters
  def self.build_nested_threshold_filter_clause(count_type, threshold_filters)
    query_array = []
    if threshold_filters.present?
      parsed = parse_custom_filters(threshold_filters)
      parsed.each do |filter|
        if count_type == filter[:count_type]
          operator = filter[:operator] == ">=" ? "gte" : "lte"
          field_name = METRICS_MAPPING[:"#{filter[:metric]}"]
          query_array << {
            "range": {
              "metric_list.#{field_name}": {
                "#{operator}": (filter[:value]).to_s,
              },
            },
          }
        end
      end
    end

    return nil if query_array.empty?

    nested_query =
      {
        "nested": {
          "path": "metric_list",
          "query": {
            "bool": {
              "filter": [
                {
                  "term": {
                    "metric_list.count_type": count_type,
                  },
                },
              ] + query_array,
            },
          },
        },
      }
    nested_query
  end

  # Parse threshold_filters to identify count type, metric, value and operator(less then or greater than)
  def self.parse_custom_filters(threshold_filters)
    parsed = []
    threshold_filters.each do |filter|
      count_type, metric = filter["metric"].split("_")
      begin
        value = Float(filter["value"])
      rescue StandardError
        Rails.logger.warn "Bad threshold filter value."
      else
        parsed << {
          count_type: count_type,
          metric: metric,
          value: value,
          operator: filter["operator"],
        }
      end
    end
    parsed
  end

  # Actual data for the heatmap is wrapped inside inner_hits of collapse ES function.
  # Iterate through the hits and inner_hits to find all the taxons
  def self.parse_es_response(es_response)
    taxons = []
    es_response["hits"]["hits"].each do |doc|
      source_doc = doc["_source"].reject { |key, _value| key == "metric_list" }
      doc["_source"]["metric_list"].each do |metric|
        unless metric["count_type"] == "merged_NT_NR"
          metric_clone = metric.clone
          # field alias conversion for the UI
          metric_clone = change_field_name(metric_clone)
          metric_clone = round_decimal_value(metric_clone)
          taxons << metric_clone.merge(source_doc)
        end
      end
    end
    return taxons
  end

  # Actual data for the heatmap is wrapped inside inner_hits of collapse ES function.
  # Iterate through the hits and inner_hits to find all the taxons
  def self.parse_top_n_taxa_per_sample_response(es_response)
    tax_ids = []
    es_response["aggregations"]["pipeline_runs"]["buckets"].each do |hits|
      hits["top_taxa"]["hits"]["hits"].each do |doc|
        tax_ids << doc["_source"]["tax_id"]
      end
    end
    return tax_ids.uniq
  end

  # field alias conversion for the UI
  def self.change_field_name(metric)
    metric["r"] = metric.delete("counts")
    metric["percentidentity"] = metric.delete("percent_identity")
    metric["logevalue"] = metric.delete("e_value")
    metric["alignmentlength"] = metric.delete("alignment_length")
    return metric
  end

  # field decimal value round up
  def self.round_decimal_value(metric)
    metric["rpm"] = metric["rpm"]&.round(4)&.to_f
    metric["zscore"] = metric["zscore"]&.round(4)&.to_f
    metric["r"] = metric["r"]&.round(4)&.to_f
    return metric
  end

  def self.organize_data_by_pr(es_results, pr_id_to_sample_id)
    # create result hash for all pipeline runs that were requested
    pipeline_runs = PipelineRun.where(id: pr_id_to_sample_id.keys().uniq).includes([:sample])
    result_hash = pipeline_runs.index_by(&:id).map { |id, pr| [id, { "pr" => pr, "taxon_counts" => [], "sample_id" => pr_id_to_sample_id[id] }] }.to_h

    # populate the taxon_counts for each pipeline run that has taxons that passed the filters
    es_results.each do |row|
      taxon_pipeline_run_id = row["pipeline_run_id"]
      result_record = result_hash[taxon_pipeline_run_id]
      if result_record["pr"]["total_reads"]
        result_record["taxon_counts"] << row
      end
    end
    return result_hash
  end

  def self.samples_taxons_details(
    results_by_pr,
    samples
  )
    results = {}

    workflow = samples.first.initial_workflow

    # Get sample results for the taxon ids
    samples_by_id = samples.index_by(&:id)
    results_by_pr.each do |_pr_id, res|
      pr = res["pr"]
      taxon_counts = res["taxon_counts"]
      sample_id = pr.sample_id
      tax_2d = ReportHelper.taxon_counts_cleanup(taxon_counts, workflow)

      rows = []
      tax_2d.each { |_tax_id, tax_info| rows << tax_info }
      compute_aggregate_scores_v2!(rows)

      results[sample_id] = {
        sample_id: sample_id,
        pipeline_version: pr.pipeline_version,
        name: samples_by_id[sample_id].name,
        metadata: samples_by_id[sample_id].metadata_with_base_type,
        host_genome_name: samples_by_id[sample_id].host_genome_name,
        taxons: rows,
        ercc_count: pr.total_ercc_reads,
      }
    end

    # For samples that didn't have matching taxons, just throw in the metadata.
    samples.each do |sample|
      unless results.key?(sample.id)
        results[sample.id] = {
          sample_id: sample.id,
          name: sample.name,
          metadata: sample.metadata_with_base_type,
          host_genome_name: sample.host_genome_name,
          ercc_count: 0,
        }
      end
    end
    # Flatten the hash
    results.values
  end

  def self.compute_aggregate_scores_v2!(rows)
    rows.each do |taxon_info|
      # NT and NR zscore are set to the same
      taxon_info["NT"]["maxzscore"] = [taxon_info["NT"]["zscore"], taxon_info["NR"]["zscore"]].max
      taxon_info["NR"]["maxzscore"] = taxon_info["NT"]["maxzscore"]
    end
  end
end
