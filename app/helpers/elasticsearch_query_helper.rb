# This is a class of static helper methods to run SQL queries over elasticsearch rest APIs
# This class is used in heatmap_helper to generate the data
module ElasticsearchQueryHelper
  config = { host: ENV["HEATMAP_ES_ADDRESS"], transport_options: { request: { timeout: 200 } } }
  ES_CLIENT = Elasticsearch::Client.new(config) unless Rails.env.test?

  GLUE_CLIENT = Aws::Glue::Client.new

  DEFAULT_QUERY_FETCH_SIZE = 100

  METRICS_MAPPING = {
    r: "counts",
    percentidentity: "percent_identity",
    alignmentlength: "alignment_length",
    logevalue: "e_value",
    rpm: "rpm",
    zscore: "zscore",
  }.freeze

  # Check is the data exists in ES for background_id and pipeline_run_ids if not then invoke AWS Glue job
  # to calculate and save scores in the ES index
  def self.update_es_for_missing_data(background_id, pipeline_run_ids)
    missing_pipeline_run_ids = find_pipeline_runs_missing_from_es(
      background_id,
      pipeline_run_ids
    )
    if missing_pipeline_run_ids.present?
      _job_status = call_aws_glue_job(
        background_id,
        missing_pipeline_run_ids
      )
    end
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

    search_body = {
      "_source": false,
      "query": {
        "bool": {
          "filter": base_query_filter_clause + threshold_filters_clause + categories_filter_clause + read_specificity_filter_clause,
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
    filter_param,
    pipeline_run_ids,
    tax_ids
  )
    tax_id_batches = batch_tax_ids(pipeline_run_ids, tax_ids)

    results = []
    # currently we will only have multiple batches if taxa_per_sample == 100 and there are more than 100 samples selected
    # if multiple batches becomes more common we should consider parallelizing these requests
    tax_id_batches.each do |tax_id_batch|
      results += fetch_all_metrics_per_sample_and_taxa(
        filter_param,
        pipeline_run_ids,
        tax_id_batch
      )
    end
    return results
  end

  # get all of the metrics for the given pipeline_run_ids X tax_ids
  def self.fetch_all_metrics_per_sample_and_taxa(
    filter_param,
    pipeline_run_ids,
    tax_ids
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
                "background_id": filter_param[:background_id].to_s,
              },
            },
            {
              "term": {
                "tax_level": filter_param[:taxon_level].to_s,
              },
            },
          ],
        },
      },
    }

    response = ES_CLIENT.search(index: "scored_taxon_counts", body: search_body)
    return parse_es_response(response)
  end

  # Hit ES REST API to fetch query result and loop through the result unless cursor is not present in the response
  # Since ES is returning 10_000 records at a time
  def self.query_es(es_query)
    es_records = []
    columns = []
    es_query = es_query.gsub(/[\r\n]+/, "")
    req_body = "{\"query\":\"#{es_query}\", \"fetch_size\": #{DEFAULT_QUERY_FETCH_SIZE} }"
    loop do
      response = es_sql_rest_call(req_body)
      if response.nil?
        return [], []
      end

      if response.body["schema"].present?
        response.body["schema"].each do |col|
          columns << col["name"]
        end
      end
      if response.body["datarows"].present?
        es_records += response.body["datarows"]
      end
      req_body = "{\"cursor\":\"#{response.body['cursor']}\"}"
      break if response.body["cursor"].blank?
    end
    return columns, es_records
  end

  # Perform REST API request to ES
  def self.es_sql_rest_call(request_body)
    begin
      response = ES_CLIENT.perform_request("POST", "_opendistro/_sql", {}, request_body, {})
      return response
    rescue StandardError => e
      LogUtil.log_error("unable to fetch heatmap data from elasticsearch: #{e}", exception: e)
      raise e
    end
    return nil
  end

  # Query ES index to check if background and pipeline run ids are present
  def self.find_pipeline_runs_missing_from_es(background_id, pipeline_run_ids)
    if pipeline_run_ids.empty?
      return []
    end

    pipeline_runs_in_es_query = "SELECT DISTINCT pipeline_run_id FROM scored_taxon_counts WHERE background_id=#{background_id} AND pipeline_run_id in (#{pipeline_run_ids.join(',')})"
    _columns, pipelines_in_es = query_es(pipeline_runs_in_es_query)
    missing_pipeline_run_ids = pipeline_run_ids - pipelines_in_es.flatten
    return missing_pipeline_run_ids.flatten
  end

  # Call to AWS glue spark job to calculate heatmap data and store it in ES
  def self.call_aws_glue_job(background_id, pipeline_run_ids)
    env = Rails.env.development? || Rails.env.test? ? "sandbox" : Rails.env
    job_name = "#{env}_heatmap_es_job"

    glue_arguments = {
      "--user_pipeline_run_ids" => pipeline_run_ids.join("|"),
      "--user_background_id" => background_id.to_s,
      "--job_type" => "selected_runs",
    }

    currently_running_job = get_running_glue_job_by_args(job_name, glue_arguments)
    if !currently_running_job.nil?
      job_run_id = currently_running_job.id
    else
      glue_response = GLUE_CLIENT.start_job_run(
        job_name: job_name.to_s,
        arguments: glue_arguments
      )
      job_run_id = glue_response.job_run_id.to_s
    end

    job_status = ""
    loop do
      resp = GLUE_CLIENT.get_job_run({ job_name: job_name.to_s, run_id: job_run_id })
      job_status = resp.job_run.job_run_state
      break if job_status != "RUNNING"
    end
    return job_status
  end

  def self.get_running_glue_job_by_args(job_name, args)
    resp = GLUE_CLIENT.get_job_runs({ job_name: job_name.to_s })
    return resp.job_runs.find do |job_run|
      job_run.job_run_state == "RUNNING" &&
      job_run.arguments["--user_pipeline_run_ids"] == args["--user_pipeline_run_ids"] &&
      job_run.arguments["--user_background_id"] == args["--user_background_id"] &&
      job_run.arguments["--job_type"] == args["--job_type"]
    end
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
    end
    read_specificity_filter_clause
  end

  # clause for the threshold filters provided by the user (and the mandatory count > 5)
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
    metric["rpm"] = metric["rpm"].round(4).to_f
    metric["zscore"] = metric["zscore"].round(4).to_f
    metric["r"] = metric["r"].round(4).to_f
    return metric
  end
end
