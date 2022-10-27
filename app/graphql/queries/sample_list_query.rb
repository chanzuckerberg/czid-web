module Queries
  module SampleListQuery
    extend ActiveSupport::Concern
    include SamplesHelper

    included do
      MAX_SAMPLES_LIMIT = 100

      field :samples_list, Types::SampleListType, null: false do
        argument :projectId, Integer, required: false
        argument :domain, String, required: false
        argument :limit, Integer, required: false
        argument :offset, Integer, required: false
        argument :orderBy, String, required: false
        argument :orderDir, String, required: false
        argument :listAllIds, GraphQL::Types::Boolean, required: false
        argument :basic, GraphQL::Types::Boolean, required: false
        argument :sampleIds, [Integer], required: false
        argument :host, String, required: false
        argument :location, String, required: false
        argument :locationV2, String, required: false
        argument :taxIds, [Integer], required: false
        argument :taxLevels, [String], required: false
        argument :thresholdFilterInfo, String, required: false
        argument :annotations, [String], required: false
        argument :time, GraphQL::Types::ISO8601DateTime, required: false
        argument :sampleType, String, required: false
        argument :visibility, [String], required: false
        argument :searchString, String, required: false
        argument :requestedSampleIds, [Integer], required: false
        argument :workflow, String, required: false
      end
    end

    def samples_list(params)
      current_user = context[:current_user]
      current_power = context[:current_power]
      sorting_v0_allowed = current_user.allowed_feature?("sorting_v0_admin") || (current_user.allowed_feature?("sorting_v0") && params[:domain] == "my_data")

      order_by = if sorting_v0_allowed
                   params["orderBy"] || "createdAt"
                 else
                   :id
                 end

      order_dir = sanitize_order_dir(params[:orderDir], :desc)
      limit = params[:limit] ? params[:limit].to_i : nil

      # API best practice is to have some hard limit to prevent an API call from
      # retrieving large amounts of data.  The app has some pages (i.e. quality control)
      # which need to retrieve all samples for a project, which may be over the limit.
      # To balance safety and functionality, if a project id is provided, we allow the limit to be disabled
      limit = if limit.nil?
                if params[:projectId]
                  nil
                else
                  MAX_SAMPLES_LIMIT
                end
              else
                [MAX_SAMPLES_LIMIT, limit].min
              end

      offset = params[offset].to_i

      list_all_sample_ids = ActiveModel::Type::Boolean.new.cast(params[:listAllIds])

      filters = {
        host: params[:host],
        location: params[:location],
        locationV2: params[:locationV2],
        taxIds: params[:taxIds],
        taxLevels: params[:taxLevels],
        thresholdFilterInfo: params[:thresholdFilterInfo],
        annotations: params[:annotations],
        time: params[:time],
        sampleType: params[:sampleType],
        visibility: params[:visibility],
        projectId: params[:projectId],
        searchString: params[:searchString],
        requestedSampleIds: params[:requestedSampleIds],
        workflow: params[:workflow],
      }

      samples = fetch_samples_with_current_power(current_power, domain: params[:domain], filters: filters)

      samples = if sorting_v0_allowed
                  Sample.sort_samples(samples, order_by, order_dir)
                else
                  samples.order(Hash[order_by => order_dir])
                end

      limited_samples = samples
      unless limit.nil?
        limited_samples = samples.offset(offset).limit(limit)
      end
      limited_samples_json = limited_samples.includes(:project).as_json(
        only: [:id, :name, :host_genome_id, :project_id, :created_at],
        methods: [:private_until]
      )

      basic = ActiveModel::Type::Boolean.new.cast(params[:basic])
      sample_ids = limited_samples.map(&:id)
      # If basic requested, then don't include extra details (ex: metadata) for each sample.
      unless basic
        samples_visibility = get_visibility_by_sample_id_and_current_power(sample_ids, current_power)
        # format_samples loads a lot of information about samples
        # There are many ways we can refactor: multiple endpoints for client to ask for the information
        # they actually need or at least a configurable function to get only certain data
        # NOTE: `details_json` guarantees the order of samples, but it would be good to make it indexed on id too
        details_json = format_samples(limited_samples).as_json(
          except: [:sfn_results_path]
        )
        limited_samples_json.zip(details_json).map do |sample, details|
          sample[:public] = samples_visibility[sample["id"]]
          sample[:details] = details
        end
      end

      results = { samples: limited_samples_json }
      results[:sampleIds] = sample_ids if list_all_sample_ids

      results = results.deep_transform_keys { |key| key.to_s.camelize(:lower) }
      results
    end
  end
end
