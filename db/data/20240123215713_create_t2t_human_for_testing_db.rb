# frozen_string_literal: true

class CreateT2tHumanForTestingDb < ActiveRecord::Migration[6.1]
  # This migration exists only to operate on the Testing DB in CI/CD. It only does
  # anything if the DB has 1 "Human" record, which is the case for the Testing DB.
  # For any long-running DB, such as Staging/Prod/Local, they already have 2 "Human"
  # records by now and don't need the data here.
  # If you need more info, check out description in PR #4215 or see CZID-8173.

  # For Testing DB, message won't matter, but may as well match deployed DBs.
  DEPRECATED_MESSAGE = "deprecated, 2023-12-13, v1, HG38"
  # Incoming values for updated T2T+HG38 indexes for Human v2
  T2T_S3_STAR_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_STAR_genome.tar"
  T2T_S3_BOWTIE2_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.bowtie2.tar"
  T2T_S3_MINIMAP2_DNA_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_dna.mmi"
  T2T_S3_MINIMAP2_RNA_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_rna.mmi"
  T2T_S3_HISAT2_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.hisat2.tar"
  T2T_S3_KALLISTO_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.kallisto.idx"
  T2T_S3_BOWTIE2_INDEX_PATH_V2 = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.bowtie2.tar"
  T2T_S3_ORIGINAL_TRANSCRIPTS_GTF_INDEX_PATH = nil

  def up
    # Early exit unless only 1 "Human", i.e., original T2T data migration never ran
    return unless HostGenome.where(name: "Human").count == 1

    curr_human = HostGenome.find_by(name: "Human")
    # Duplicate the existing human record to save a copy of old "Human" version
    deprecated_human = HostGenome.new(
      name: "Human",
      deprecation_status: DEPRECATED_MESSAGE,
      # v0 is temporary, only here to avoid uniqueness violation.
      version: 0
      )
    deprecated_human.s3_star_index_path = curr_human.s3_star_index_path
    deprecated_human.s3_bowtie2_index_path = curr_human.s3_bowtie2_index_path
    deprecated_human.s3_minimap2_dna_index_path = curr_human.s3_minimap2_dna_index_path
    deprecated_human.s3_minimap2_rna_index_path = curr_human.s3_minimap2_rna_index_path
    deprecated_human.s3_hisat2_index_path = curr_human.s3_hisat2_index_path
    deprecated_human.s3_kallisto_index_path = curr_human.s3_kallisto_index_path
    deprecated_human.s3_bowtie2_index_path_v2 = curr_human.s3_bowtie2_index_path_v2
    deprecated_human.s3_original_transcripts_gtf_index_path = curr_human.s3_original_transcripts_gtf_index_path
    deprecated_human.skip_deutero_filter = curr_human.skip_deutero_filter
    deprecated_human.taxa_category = curr_human.taxa_category
    deprecated_human.default_background_id = curr_human.default_background_id
    deprecated_human.save!
    # Creation of record forces model's use of `add_default_metadata_fields`,
    # but we want the HG38 human to actually get whatever current human has now.
    deprecated_human.metadata_fields = curr_human.metadata_fields
    deprecated_human.save!

    # Update the current human in place to values for "Human" v2 [T2T+HG38].
    curr_human.s3_star_index_path = T2T_S3_STAR_INDEX_PATH
    curr_human.s3_bowtie2_index_path = T2T_S3_BOWTIE2_INDEX_PATH
    curr_human.s3_minimap2_dna_index_path = T2T_S3_MINIMAP2_DNA_INDEX_PATH
    curr_human.s3_minimap2_rna_index_path = T2T_S3_MINIMAP2_RNA_INDEX_PATH
    curr_human.s3_hisat2_index_path = T2T_S3_HISAT2_INDEX_PATH
    curr_human.s3_kallisto_index_path = T2T_S3_KALLISTO_INDEX_PATH
    curr_human.s3_bowtie2_index_path_v2 = T2T_S3_BOWTIE2_INDEX_PATH_V2
    curr_human.s3_original_transcripts_gtf_index_path = T2T_S3_ORIGINAL_TRANSCRIPTS_GTF_INDEX_PATH
    curr_human.version = 2
    curr_human.save!

    # Deprecated human is original, Human v1. Loop back and properly set it to v1.
    # Setting it as v0 was just a temp value to avoid blowing up uniquenss constraint.
    deprecated_human.version = 1
    deprecated_human.save!
  end

  def down
    # Trying to programmatically roll back this migration is dangerous because
    # Testing and Staging/Prod get here via different paths.
    raise ActiveRecord::IrreversibleMigration
  end
end
