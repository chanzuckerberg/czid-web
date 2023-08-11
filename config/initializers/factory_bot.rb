module FactoryBot
  module Strategy
    class FindOrCreate
      def initialize
        @build_strategy = FactoryBot.strategy_by_name(:build).new
      end

      delegate :association, to: :@build_strategy

      def result(evaluation)
        attributes = attributes_shared_with_build_result(evaluation)

        find_or_create_model(evaluation, attributes)
      end

      def to_sym
        if @build_strategy.respond_to?(:to_sym)
          @build_strategy.to_sym
        else
          @build_strategy.class
        end
      end

      private

      def find_or_create_model(evaluation, attributes)
        check_if_record_exists = {
          User => ->(user_attributes) { User.where(email: user_attributes[:email]).first },
          AppConfig => ->(app_config_attributes) { AppConfig.where(key: app_config_attributes[:key]).first },
          Project => ->(project_attributes) { Project.where(name: project_attributes[:name]).first },
          HostGenome => ->(host_genome_attributes) { HostGenome.where(name: host_genome_attributes[:name]).first },
          Sample => ->(sample_attributes) { Sample.where(name: sample_attributes[:name]).first },
          PipelineRun => ->(pipeline_run_attributes) { PipelineRun.where(sample_id: pipeline_run_attributes[:sample_id], technology: pipeline_run_attributes[:technology]).first },
          TaxonCount => ->(taxon_count_attributes) { TaxonCount.where(pipeline_run_id: taxon_count_attributes[:pipeline_run_id], tax_id: taxon_count_attributes[:tax_id]).first },
          TaxonLineage => ->(taxon_lineage_attributes) { TaxonLineage.where(taxid: taxon_lineage_attributes[:taxid]).first },
          OutputState => ->(output_state_attributes) { OutputState.where(pipeline_run_id: output_state_attributes[:pipeline_run_id], output: output_state_attributes[:output]).first },
          WorkflowVersion => ->(workflow_version_attributes) { WorkflowVersion.where(workflow: workflow_version_attributes[:workflow], version: workflow_version_attributes[:version]).first },
          MetadataField => ->(metadata_field_attributes) { MetadataField.where(name: metadata_field_attributes[:name]).first },
          Citation => ->(citation_attributes) { Citation.where(key: citation_attributes[:key]).first },
          Pathogen => ->(pathogen_attributes) { Pathogen.where(tax_id: pathogen_attributes[:tax_id]).first },
          Background => ->(background_attributes) { Background.where(name: background_attributes[:name]).first },
        }

        check_for_presence = check_if_record_exists.key?(evaluation.object.class) ? check_if_record_exists[evaluation.object.class].call(attributes) : evaluation.object.class.where(attributes).first
        check_for_presence || FactoryBot.strategy_by_name(:create).new.result(evaluation)
      end

      # Here we handle possible mismatches between initially provided attributes and actual model attrbiutes
      # For example, devise's User model is given a `password` and generates an `encrypted_password`
      # In this case, we shouldn't use `password` in the `where` clause
      def attributes_shared_with_build_result(evaluation)
        object_attributes = evaluation.object.attributes
        evaluation.hash.filter { |k, _v| object_attributes.key?(k.to_s) }
      end
    end
  end
end

FactoryBot.register_strategy(:find_or_create, FactoryBot::Strategy::FindOrCreate)
