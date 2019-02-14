module HeatmapHelper
  def heatmap
    @heatmap_data = {
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
          { text: "NT log(1/e)", value: "NT_neglogevalue" },
          { text: "NR Z Score", value: "NR_zscore" },
          { text: "NR r (total reads)", value: "NR_r" },
          { text: "NR rPM", value: "NR_rpm" },
          { text: "NR %id", value: "NR_percentidentity" },
          { text: "R log(1/e)", value: "NR_neglogevalue" }
        ],
        operators: [">=", "<="]
      }
    }
  end

  def download_heatmap
    @sample_taxons_dict = sample_taxons_dict(params)
    output_csv = generate_heatmap_csv(@sample_taxons_dict)
    send_data output_csv, filename: 'heatmap.csv'
  end

  # TODO: (gdingle): access control
  def save_heatmap
    @data = params[:heatmapParams]
    vis = Visualization.create(
      user: current_user,
      data: @data
    )
    vis.sample_ids = @data[:sampleIds]

    render json: {
      status: "success",
      message: "Heatmap saved successfully",
      data: @data
    }
  rescue => err
    render json: {
      status: "failed",
      message: "Unable to save heatmap",
      errors: [err]
    }
  end
end
