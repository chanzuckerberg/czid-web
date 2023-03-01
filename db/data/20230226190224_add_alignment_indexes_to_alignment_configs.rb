# frozen_string_literal: true

class AddAlignmentIndexesToAlignmentConfigs < ActiveRecord::Migration[6.1]
  def up
    alignment_config = AlignmentConfig.find_by(name: "2021-01-22")
    if alignment_config
        alignment_config.minimap2_long_db_path = "s3://czid-public-references/ncbi-indexes-prod/2021-01-22/index-generation-2/nt_k14_w8_20_long/"
        alignment_config.minimap2_short_db_path = "s3://czid-public-references/ncbi-indexes-prod/2021-01-22/index-generation-2/nt_k14_w8_20/"
        alignment_config.diamond_db_path = "s3://czid-public-references/ncbi-indexes-prod/2021-01-22/index-generation-2/diamond_index_chunksize_5500000000/"
        alignment_config.save!
    end

    alignment_config = AlignmentConfig.find_by(name: "2022-06-02") || AlignmentConfig.new
    alignment_config.name = "2022-06-02"
    alignment_config.s3_nt_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt"
    alignment_config.s3_nt_loc_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_loc.marisa"
    alignment_config.s3_nr_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nr"
    alignment_config.s3_nr_loc_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nr_loc.marisa"
    alignment_config.s3_lineage_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/taxid-lineages.marisa"
    alignment_config.s3_accession2taxid_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/accession2taxid.marisa"
    alignment_config.s3_deuterostome_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/deuterostome_taxids.txt"
    alignment_config.s3_nt_info_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_info.marisa"
    alignment_config.s3_taxon_blacklist_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/taxon_ignore_list.txt"
    alignment_config.lineage_version = "2022-06-02"
    alignment_config.minimap2_long_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_k14_w8_20_long/"
    alignment_config.minimap2_short_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_k14_w8_20/"
    alignment_config.diamond_db_path = "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/diamond_index_chunksize_5500000000/"
    alignment_config.save!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end