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
  def self.update_es_for_missing_data(background_id, pr_id_to_sample_id)
    missing_pipeline_run_ids = background_pipeline_present_in_es(
      background_id,
      pr_id_to_sample_id
    )
    if missing_pipeline_run_ids.present?
      _job_status = call_aws_glue_job(
        background_id,
        pr_id_to_sample_id
      )
    end
  end

  # Based on the provided filter criteria, query ES index and return top taxons
  def self.top_taxon_search(
    filter_param,
    pr_id_to_sample_id
  )
    query_clause = build_query_clause(filter_param, pr_id_to_sample_id)
    search_params = {
      "_source": false,
      "from": 0,
      "size": filter_param[:taxons_per_sample],
      "query": query_clause,
      "sort": build_sort_clause(filter_param[:sort_by]),
      "collapse": {
        "field": "tax_id",
        "inner_hits": [
          {
            "name": "documents",
            "size": pr_id_to_sample_id.keys.size,
            "_source": [
              "*",
            ],
          },
        ],
      },
    }
    response = ES_CLIENT.search(index: "scored_taxon_count", body: search_params)
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
    end
    return nil
  end

  # Query ES index to check if background and pipeline run ids are present
  def self.background_pipeline_present_in_es(background_id, pr_id_to_sample_id)
    pipeline_run_id_for_heatmap = pr_id_to_sample_id.keys
    missing_pipeline_run_ids_queries = "SELECT DISTINCT pipeline_run_id FROM scored_taxon_count WHERE background_id=#{background_id} AND pipeline_run_id in (#{pr_id_to_sample_id.keys.join(',')})"
    _columns, pipeline_run_ids_present = query_es(missing_pipeline_run_ids_queries)
    missing_pipeline_run_ids = pipeline_run_id_for_heatmap - pipeline_run_ids_present.flatten
    return missing_pipeline_run_ids.flatten
  end

  # Call to AWS glue spark job to calculate heatmap data and store it in ES
  def self.call_aws_glue_job(background_id, pr_id_to_sample_id)
    env = Rails.env.development? || Rails.env.test? ? "sandbox" : Rails.env
    job_name = "#{env}_heatmap_es_job"
    glue_response = GLUE_CLIENT.start_job_run(
      job_name: job_name.to_s,
      arguments: {
        "--user_pipeline_run_ids" => pr_id_to_sample_id.keys.join("|"),
        "--user_background_id" => background_id.to_s,
      }
    )
    job_status = ""
    loop do
      resp = GLUE_CLIENT.get_job_run({ job_name: job_name.to_s, run_id: glue_response.job_run_id.to_s })
      job_status = resp.job_run.job_run_state
      break if job_status != "RUNNING"
    end
    return job_status
  end

  # Build ES query clause for the provided filter values
  def self.build_query_clause(filter_param, pr_id_to_sample_id)
    query_must_array = build_query_must_clause(
      filter_param[:min_reads],
      filter_param[:threshold_filters]
    )

    query_filter_hash_array = build_query_filter_clause(
      pr_id_to_sample_id,
      filter_param
    )

    query_must_not_hash_array = build_query_must_not_clause(
      filter_param[:categories],
      filter_param[:include_phage]
    )

    {
      "bool": {
        "must": query_must_array,
        "filter": query_filter_hash_array,
        "must_not": [
          {
            "bool": {
              "filter": query_must_not_hash_array,
            },
          },
        ],
      },
    }
  end

  def self.build_query_filter_clause(
    pr_id_to_sample_id,
    filter_param
  )
    must_filter_array = []
    must_filter_array << get_pipeline_run_filter(pr_id_to_sample_id)
    must_filter_array << get_background_filter(filter_param[:background_id])
    must_filter_array << get_taxon_level_filter(filter_param[:taxon_level])
    must_filter_array << get_categories_filter(filter_param[:categories], filter_param[:include_phage])
    must_filter_array << get_phage_filter(filter_param[:categories], filter_param[:include_phage])[1]
    must_filter_array << get_read_specificity_filter(filter_param[:read_specificity])
    must_filter_array << get_tax_ids_clause(filter_param[:taxon_ids])
    return must_filter_array.compact
  end

  def self.get_pipeline_run_filter(pr_id_to_sample_id)
    {
      "terms": {
        "pipeline_run_id": pr_id_to_sample_id.keys,
      },
    }
  end

  def self.get_background_filter(background_id)
    {
      "term": {
        "background_id": background_id.to_s,
      },
    }
  end

  def self.get_taxon_level_filter(taxon_level)
    {
      "term": {
        "tax_level": taxon_level.to_s,
      },
    }
  end

  def self.get_categories_filter(categories, include_phage)
    categories_clause = nil

    if categories.present?
      categories = categories.map { |category| ReportHelper::CATEGORIES_TAXID_BY_NAME[category] }.compact
      categories_clause = {
        "terms": {
          "superkingdom_taxid": categories,
        },
      }
    elsif include_phage
      categories_clause = {
        "term": {
          "superkingdom_taxid": (ReportHelper::CATEGORIES_TAXID_BY_NAME["Viruses"]).to_s,
        },
      }
    end
    categories_clause
  end

  def self.get_phage_filter(categories, include_phage)
    phage_clause = {
      "term": {
        "is_phage": 1,
      },
    }
    if !include_phage && categories.present?
      # explicitly filter out phages
      return phage_clause, nil
    elsif include_phage && categories.blank?
      # only fetch phages
      return nil, phage_clause
    end

    return nil, nil
  end

  def self.get_read_specificity_filter(read_specificity)
    read_specificity_clause = nil
    if read_specificity == 1
      read_specificity_clause = {
        "range": {
          "tax_id": {
            "gte": "0",
          },
        },
      }
    end
    read_specificity_clause
  end

  # Apply count_type and metric sort clause depending upon metric filter
  def self.build_sort_clause(sort_by)
    sort = ReportHelper.decode_sort_by(sort_by)
    count_type_order = "desc"
    if sort[:count_type] == "NR"
      count_type_order = "asc"
    end
    metric = sort[:metric]

    [
      {
        "metric_list.count_type": {
          "order": count_type_order,
          "nested": {
            "path": "metric_list",
          },
        },
      },
      {
        "metric_list.#{metric}": {
          "order": "desc",
          "nested": {
            "path": "metric_list",
          },
        },
      },
    ]
  end

  def self.get_tax_ids_clause(tax_ids)
    if tax_ids.present?
      {
        "terms": {
          "tax_id": tax_ids,
        },
      }
    end
  end

  # Query clause which must not be match to find the taxons
  def self.build_query_must_not_clause(
    categories,
    include_phage
  )
    must_not_filter_array = []
    must_not_filter_array << genus_taxid_filter()
    must_not_filter_array << get_phage_filter(categories, include_phage)[0]
    return must_not_filter_array.compact
  end

  def self.genus_taxid_filter
    {
      "term": {
        "genus_taxid": "-201",
      },
    }
  end

  # Query clause which must be match to find the taxons
  def self.build_query_must_clause(
    _min_reads,
    threshold_filters
  )
    query_must_array = []
    nt_nested_clause = build_nested_query_must_clause("NT", threshold_filters)
    nr_nested_clause = build_nested_query_must_clause("NR", threshold_filters)

    query_must_array << nt_nested_clause
    query_must_array << nr_nested_clause
    return query_must_array.compact
  end

  # Build nested query clause to apply threshold filters
  def self.build_nested_query_must_clause(count_type, threshold_filters)
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

    # Mandatory count type clause ['NT','NR']
    query_array <<
      {
        "match": {
          "metric_list.count_type": count_type.to_s,
        },
      }
    # Mandatory counts clause > 5
    query_array <<
      {
        "range": {
          "metric_list.counts": {
            "gte": 5,
          },
        },
      }
    nested_query =
      {
        "nested": {
          "path": "metric_list",
          "query": {
            "bool": {
              "must": query_array,
            },
          },
        },
      }
    return nested_query
  end

  # Parse threshold_filters to identify county type, metric, value and operator(less then or greater than)
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
    es_response["hits"]["hits"].each do |hits|
      hits["inner_hits"]["documents"]["hits"]["hits"].each do |doc|
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
    end
    return taxons
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
