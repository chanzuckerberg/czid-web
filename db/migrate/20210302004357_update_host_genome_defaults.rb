class UpdateHostGenomeDefaults < ActiveRecord::Migration[5.2]
  def change
    change_column_default :host_genomes, :s3_bowtie2_index_path, HostGenome.s3_bowtie2_index_path_default
    change_column_default :host_genomes, :s3_star_index_path, HostGenome.s3_star_index_path_default
    change_column_default :alignment_configs, :s3_taxon_blacklist_path, "s3://idseq-public-references/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxon_blacklist.txt"
  end
end
