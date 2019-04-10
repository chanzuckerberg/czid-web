module HeatmapHelper
  def heatmap
    {
      taxonLevels: %w[Genus Species],
      categories: ReportHelper::ALL_CATEGORIES.pluck('name'),
      subcategories: {
        Viruses: ["Phage"]
      },
      metrics: [
        { text: "Aggregate Score", value: "NT.aggregatescore" },
        { text: "NT Z Score", value: "NT.zscore" },
        { text: "NT rPM", value: "NT.rpm" },
        { text: "NT r (total reads)", value: "NT.r" },
        { text: "NR Z Score", value: "NR.zscore" },
        { text: "NR r (total reads)", value: "NR.r" },
        { text: "NR rPM", value: "NR.rpm" }
      ],
      backgrounds: current_power.backgrounds.map do |background|
        { name: background.name, value: background.id }
      end,
      thresholdFilters: {
        targets: [
          { text: "Aggregate Score", value: "NT_aggregatescore" },
          { text: "NT Z Score", value: "NT_zscore" },
          { text: "NT rPM", value: "NT_rpm" },
          { text: "NT r (total reads)", value: "NT_r" },
          { text: "NT %id", value: "NT_percentidentity" },
          { text: "NT L (alignment length in bp)", value: "NT_alignmentlength" },
          { text: "NT log(1/e)", value: "NT_neglogevalue" },
          { text: "NR Z Score", value: "NR_zscore" },
          { text: "NR r (total reads)", value: "NR_r" },
          { text: "NR rPM", value: "NR_rpm" },
          { text: "NR %id", value: "NR_percentidentity" },
          { text: "NR L (alignment length in bp)", value: "NR_alignmentlength" },
          { text: "R log(1/e)", value: "NR_neglogevalue" }
        ],
        operators: [">=", "<="]
      },
      allowedFeatures: current_user.allowed_feature_list
    }
  end

  def download_heatmap
    @sample_taxons_dict = sample_taxons_dict(params)
    output_csv = generate_heatmap_csv(@sample_taxons_dict)
    send_data output_csv, filename: 'heatmap.csv'
  end

  def samples_taxons
    @sample_taxons_dict = sample_taxons_dict(params)
    render json: @sample_taxons_dict
  end

  def sample_taxons_dict(params)
    sample_ids = (params[:sampleIds] || []).map(&:to_i)
    num_results = params[:taxonsPerSample] ? params[:taxonsPerSample].to_i : DEFAULT_MAX_NUM_TAXONS
    removed_taxon_ids = (params[:removedTaxonIds] || []).map do |x|
      begin
        Integer(x)
      rescue ArgumentError
        nil
      end
    end
    removed_taxon_ids = removed_taxon_ids.compact
    categories = params[:categories]
    threshold_filters = if params[:thresholdFilters].is_a?(Array)
                          (params[:thresholdFilters] || []).map { |filter| JSON.parse(filter || "{}") }
                        else
                          JSON.parse(params[:thresholdFilters] || "[]")
                        end
    subcategories = if params[:subcategories].respond_to?(:to_h)
                      params[:subcategories].permit!.to_h
                    else
                      JSON.parse(params[:subcategories] || "{}")
                    end
    include_phage = subcategories.fetch("Viruses", []).include?("Phage")
    read_specificity = params[:readSpecificity] ? params[:readSpecificity].to_i == 1 : false

    # TODO: should fail if field is not well formatted and return proper error to client
    sort_by = params[:sortBy] || ReportHelper::DEFAULT_TAXON_SORT_PARAM
    species_selected = params[:species] == "1" # Otherwise genus selected
    samples = current_power.samples.where(id: sample_ids).includes([:host_genome, :pipeline_runs, metadata: [:metadata_field]])
    return {} if samples.empty?

    first_sample = samples.first
    background_id = params[:background] ? params[:background].to_i : get_background_id(first_sample)

    taxon_ids = top_taxons_details(samples, background_id, num_results, sort_by, species_selected, categories, threshold_filters, read_specificity, include_phage).pluck("tax_id")
    taxon_ids -= removed_taxon_ids

    samples_taxons_details(samples, taxon_ids, background_id, species_selected, threshold_filters)
  end
end
