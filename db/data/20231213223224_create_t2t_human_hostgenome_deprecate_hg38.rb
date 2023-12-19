# frozen_string_literal: true

class CreateT2tHumanHostgenomeDeprecateHg38 < ActiveRecord::Migration[6.1]
  DEPRECATED_MESSAGE = "deprecated, 2023-12-13, v1, HG38"

  # Incoming values for updated T2T+HG38 indexes for Human HostGenome
  # These S3 locations are accessible both from Staging and Prod.
  # Obtained by directly querying "Human T2T" HG on Staging in Dec 2023.
  T2T_S3_STAR_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_STAR_genome.tar"
  T2T_S3_BOWTIE2_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.bowtie2.tar"
  T2T_S3_MINIMAP2_DNA_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_dna.mmi"
  T2T_S3_MINIMAP2_RNA_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_rna.mmi"
  T2T_S3_HISAT2_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.hisat2.tar"
  T2T_S3_KALLISTO_INDEX_PATH = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.kallisto.idx"
  T2T_S3_BOWTIE2_INDEX_PATH_V2 = "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.bowtie2.tar"
  # While HG38 had a non-null value for \/\/, T2T does not. This is fine because
  # only workflow that consumes it no longer uses it at all in current version.
  T2T_S3_ORIGINAL_TRANSCRIPTS_GTF_INDEX_PATH = nil

  def up
    # Early exit if we've already got the deprecated HostGenome. Must have
    # come in already via pulling a DB dump from Staging to local or similar
    # and we will assume primary "Human" has been updated already.
    return if HostGenome.find_by(deprecation_status: DEPRECATED_MESSAGE)

    # At start of this migration, "Human" HostGenome is HG38
    # By end, it will become the T2T and we will have created a new HostGenome
    # that contains the previously existing HG38 values and is deprecated.
    curr_human = HostGenome.find_by(name: "Human")
    # Duplicate everything in current, HG38 to deprecated record
    deprecated_hg38 = HostGenome.new(name: "Human", deprecation_status: DEPRECATED_MESSAGE)
    deprecated_hg38.s3_star_index_path = curr_human.s3_star_index_path
    deprecated_hg38.s3_bowtie2_index_path = curr_human.s3_bowtie2_index_path
    deprecated_hg38.s3_minimap2_dna_index_path = curr_human.s3_minimap2_dna_index_path
    deprecated_hg38.s3_minimap2_rna_index_path = curr_human.s3_minimap2_rna_index_path
    deprecated_hg38.s3_hisat2_index_path = curr_human.s3_hisat2_index_path
    deprecated_hg38.s3_kallisto_index_path = curr_human.s3_kallisto_index_path
    deprecated_hg38.s3_bowtie2_index_path_v2 = curr_human.s3_bowtie2_index_path_v2
    deprecated_hg38.s3_original_transcripts_gtf_index_path = curr_human.s3_original_transcripts_gtf_index_path
    deprecated_hg38.skip_deutero_filter = curr_human.skip_deutero_filter
    deprecated_hg38.taxa_category = curr_human.taxa_category
    deprecated_hg38.default_background_id = curr_human.default_background_id

    # First save to kick off creation, but we're not done with it.
    deprecated_hg38.save!
    # Creation of record forces model's use of `add_default_metadata_fields`,
    # but we want the HG38 human to actually get whatever current human has now.
    deprecated_hg38.metadata_fields = curr_human.metadata_fields
    deprecated_hg38.save!

    # Now that we have the deprecated version held on to for posterity,
    # we update the current human in place to T2T+HG38 values.
    curr_human.s3_star_index_path = T2T_S3_STAR_INDEX_PATH
    curr_human.s3_bowtie2_index_path = T2T_S3_BOWTIE2_INDEX_PATH
    curr_human.s3_minimap2_dna_index_path = T2T_S3_MINIMAP2_DNA_INDEX_PATH
    curr_human.s3_minimap2_rna_index_path = T2T_S3_MINIMAP2_RNA_INDEX_PATH
    curr_human.s3_hisat2_index_path = T2T_S3_HISAT2_INDEX_PATH
    curr_human.s3_kallisto_index_path = T2T_S3_KALLISTO_INDEX_PATH
    curr_human.s3_bowtie2_index_path_v2 = T2T_S3_BOWTIE2_INDEX_PATH_V2
    curr_human.s3_original_transcripts_gtf_index_path = T2T_S3_ORIGINAL_TRANSCRIPTS_GTF_INDEX_PATH
    curr_human.save!
  end

  def down
    # At this point, the current, active "Human" is on T2T+HG38.
    # Use the values from deprecated version to convert active human back
    # to HG38, then throw out deprecated record to get back to where we were.
    curr_human = HostGenome.find_by(name: "Human", deprecation_status: "active")
    deprecated_hg38 = HostGenome.find_by(deprecation_status: DEPRECATED_MESSAGE)

    curr_human.s3_star_index_path = deprecated_hg38.s3_star_index_path
    curr_human.s3_bowtie2_index_path = deprecated_hg38.s3_bowtie2_index_path
    curr_human.s3_minimap2_dna_index_path = deprecated_hg38.s3_minimap2_dna_index_path
    curr_human.s3_minimap2_rna_index_path = deprecated_hg38.s3_minimap2_rna_index_path
    curr_human.s3_hisat2_index_path = deprecated_hg38.s3_hisat2_index_path
    curr_human.s3_kallisto_index_path = deprecated_hg38.s3_kallisto_index_path
    curr_human.s3_bowtie2_index_path_v2 = deprecated_hg38.s3_bowtie2_index_path_v2
    curr_human.s3_original_transcripts_gtf_index_path = deprecated_hg38.s3_original_transcripts_gtf_index_path
    curr_human.save!

    deprecated_hg38.destroy!
  end
end
