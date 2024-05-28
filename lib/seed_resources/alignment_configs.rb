require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class AlignmentConfigs < Base
    def seed
      # Originally created in db/migrate/20180716215830_create_alignment_configs.rb
      FactoryBot.find_or_create(
        :alignment_config,
        name: "2018-02-15",
        index_dir_suffix: nil,
        s3_nt_db_path: "s3://idseq-public-references/20170824/blast_db/nt",
        s3_nt_loc_db_path: "s3://idseq-public-references/20170824/blast_db/nt_loc.db",
        s3_nr_db_path: "s3://idseq-public-references/20170824/blast_db/nr",
        s3_nr_loc_db_path: "s3://idseq-public-references/20170824/blast_db/nr_loc.db",
        s3_lineage_path: "s3://idseq-public-references/taxonomy/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/taxid-lineages.db",
        s3_accession2taxid_path:
          "s3://idseq-public-references/alignment_data/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/accession2taxid.db",
        s3_deuterostome_db_path:
          "s3://idseq-public-references/taxonomy/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/deuterostome_taxids.txt",
        s3_nt_info_db_path: nil,
        s3_taxon_blacklist_path:
          "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxon_blacklist.txt",
        lineage_version_old: 1,
        lineage_version: "2018-02-15",
        minimap2_long_db_path: nil,
        minimap2_short_db_path: nil,
        diamond_db_path: nil
      )

      # Originally created in db/migrate/20180716215830_create_alignment_configs.rb
      FactoryBot.find_or_create(
        :alignment_config,
        name: "2018-04-01",
        index_dir_suffix: "2018-04-01",
        s3_nt_db_path: "s3://idseq-public-references/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nt",
        s3_nt_loc_db_path: "s3://idseq-public-references/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nt_loc.db",
        s3_nr_db_path: "s3://idseq-public-references/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nr",
        s3_nr_loc_db_path: "s3://idseq-public-references/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nr_loc.db",
        s3_lineage_path: "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxid-lineages.db",
        s3_accession2taxid_path:
        "s3://idseq-public-references/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/accession2taxid.db",
        s3_deuterostome_db_path:
        "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/deuterostome_taxids.txt",
        s3_nt_info_db_path: nil,
        s3_taxon_blacklist_path:
        "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxon_blacklist.txt",
        lineage_version_old: 2,
        lineage_version: "2018-04-01",
        minimap2_long_db_path: nil,
        minimap2_short_db_path: nil,
        diamond_db_path: nil
      )

      # Originally created in db/migrate/20181211174900_add_december_eighteen_alignment_config.rb
      FactoryBot.find_or_create(
        :alignment_config,
        name: "2018-12-01",
        index_dir_suffix: "2018-12-01",
        s3_nt_db_path: "s3://idseq-public-references/alignment_data/2018-12-01/nt",
        s3_nt_loc_db_path: "s3://idseq-public-references/alignment_data/2018-12-01/nt_loc.db",
        s3_nr_db_path: "s3://idseq-public-references/alignment_data/2018-12-01/nr",
        s3_nr_loc_db_path: "s3://idseq-public-references/alignment_data/2018-12-01/nr_loc.db",
        s3_lineage_path: "s3://idseq-public-references/taxonomy/2018-12-01/taxid-lineages.db",
        s3_accession2taxid_path: "s3://idseq-public-references/alignment_data/2018-12-01/accession2taxid.db",
        s3_deuterostome_db_path: "s3://idseq-public-references/taxonomy/2018-12-01/deuterostome_taxids.txt",
        s3_nt_info_db_path: nil,
        s3_taxon_blacklist_path: "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxon_blacklist.txt",
        lineage_version_old: 3,
        lineage_version: "2018-12-01",
        minimap2_long_db_path: nil,
        minimap2_short_db_path: nil,
        diamond_db_path: nil
      )

      FactoryBot.find_or_create(
        :alignment_config,
        name: "2021-01-22",
        index_dir_suffix: "2021-01-22",
        s3_nt_db_path: "s3://idseq-public-references/ncbi-sources/2021-01-22/nt",
        s3_nt_loc_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nt_loc.db",
        s3_nr_db_path: "s3://idseq-public-references/ncbi-sources/2021-01-22/nr",
        s3_nr_loc_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nr_loc.db",
        s3_lineage_path: "s3://idseq-public-references/taxonomy/2021-01-22/taxid-lineages.db",
        s3_accession2taxid_path: "s3://idseq-public-references/alignment_data/2021-01-22-full-nr/accession2taxid.db",
        s3_deuterostome_db_path: "s3://idseq-public-references/taxonomy/2021-01-22/deuterostome_taxids.txt",
        created_at: "2021-05-27 02:28:39",
        updated_at: "2021-12-08 01:32:38",
        s3_nt_info_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nt_info.db",
        s3_taxon_blacklist_path: "s3://idseq-public-references/taxonomy/2021-01-22/taxon_blacklist.txt",
        lineage_version_old: 8,
        lineage_version: "2021-01-22"
      )

      # Updated in db/data/20230226190224_add_alignment_indexes_to_alignment_configs.rb
      FactoryBot.find_or_create(
        :alignment_config,
        name: "2022-06-02",
        index_dir_suffix: nil,
        s3_nt_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt",
        s3_nt_loc_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_loc.marisa",
        s3_nr_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nr",
        s3_nr_loc_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nr_loc.marisa",
        s3_lineage_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/taxid-lineages.marisa",
        s3_accession2taxid_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/accession2taxid.marisa",
        s3_deuterostome_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/deuterostome_taxids.txt",
        s3_nt_info_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_info.marisa",
        s3_taxon_blacklist_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/taxon_ignore_list.txt",
        lineage_version_old: nil,
        lineage_version: "2022-06-02",
        minimap2_long_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_k14_w8_20_long/",
        minimap2_short_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/nt_k14_w8_20/",
        diamond_db_path: "s3://czid-public-references/ncbi-indexes-prod/2022-06-02/index-generation-2/diamond_index_chunksize_5500000000/"
      )

      FactoryBot.find_or_create(
        :alignment_config,
        name: "2024-02-06",
        index_dir_suffix: nil,
        s3_nt_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nt_compressed_shuffled.fa",
        s3_nt_loc_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nt_loc.marisa",
        s3_nr_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nr_compressed_shuffled.fa",
        s3_nr_loc_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nr_loc.marisa",
        s3_lineage_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/taxid-lineages.marisa",
        s3_accession2taxid_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/accession2taxid.marisa",
        s3_deuterostome_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/deuterostome_taxids.txt",
        s3_nt_info_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nt_info.marisa",
        s3_taxon_blacklist_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/taxon_ignore_list.txt",
        lineage_version_old: nil,
        lineage_version: "2024-02-06",
        minimap2_long_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nt_k14_w8_20/",
        minimap2_short_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/nt_k14_w8_20/",
        diamond_db_path: "s3://czid-public-references/ncbi-indexes-prod/2024-02-06/index-generation-2/diamond_index_chunksize_5500000000/"
      )
    end
  end
end
