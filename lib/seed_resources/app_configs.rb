require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class AppConfigs < Base
    CURRENT_ALIGNMENT_CONFIG_NAME = "2024-02-06".freeze

    def seed
      launched_features
      workflow_versions
      sfn_configs
      alignment_config
    end

    private

    def sfn_configs
      find_or_create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: "arn:aws:states:us-west-2:732052188396:stateMachine:idseq-swipe-dev-default-wdl")
      find_or_create(:app_config, key: AppConfig::ENABLE_SFN_NOTIFICATIONS, value: "1")

      find_or_create(:app_config, key: AppConfig::SFN_ARN, value: "arn:aws:states:us-west-2:732052188396:stateMachine:idseq-swipe-dev-short-read-mngs-wdl")
      find_or_create(:app_config, key: AppConfig::SFN_MNGS_ARN, value: "arn:aws:states:us-west-2:732052188396:stateMachine:idseq-swipe-dev-short-read-mngs-wdl")
      find_or_create(:app_config, key: AppConfig::SFN_CG_ARN, value: "arn:aws:states:us-west-2:732052188396:stateMachine:idseq-swipe-dev-default-wdl")
    end

    def workflow_versions
      workflow_versions = {
        "consensus-genome" => "3.4.18",
        "short-read-mngs" => "8.3.3",
        "phylotree-ng" => "6.11.0",
        "amr" => "1.2.5",
        "long-read-mngs" => "0.7.3",
      }

      workflow_versions.each do |workflow, version|
        find_or_create(:app_config, key: "#{workflow}-version", value: version)
        find_or_create(:workflow_version, workflow: workflow.underscore, version: version)
      end
    end

    def alignment_config
      find_or_create(:app_config, key: AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME, value: CURRENT_ALIGNMENT_CONFIG_NAME)
      find_or_create(:workflow_version, workflow: AlignmentConfig::NCBI_INDEX, version: "2021-01-22")
    end

    def launched_features
      features = [
        "bulk_downloads",
        "sample_type_free_text",
        "host_genome_free_text",
        "heatmap_filter_fe",
        "mass_normalized",
        "plqc",
        "consensus_genome",
        "cg_bulk_downloads",
        "nextclade",
        "gen_viral_cg",
        "nanopore",
        "nanopore_v1",
        "cg_flat_list",
        "phylo_tree_ng",
        "improved_bg_model_selection",
        "landing_v2",
        "taxon_heatmap_presets",
        "blast",
        "annotation",
        "heatmap_pin_samples",
        "sorting_v0",
        "taxon_threshold_filter",
        "microbiome",
        "annotation_filter",
        "blast_v1",
        "pre_upload_check",
        "heatmap_elasticsearch",
        "samples_table_metadata_columns",
        "ont_v1",
        "bulk_deletion",
        "left_heatmap_filters",
        "amr_v3",
        "amr_v2",
        "amr_v1",
        "wgs_cg_upload",
      ]

      find_or_create(:app_config, key: AppConfig::LAUNCHED_FEATURES, value: features.to_json)
    end
  end
end
