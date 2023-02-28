# frozen_string_literal: true

NEW_INDEXES = {
 "Chelonia Mydas" => {
   "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas.bowtie2.tar",
   "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas.hisat2.tar",
   "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas.kallisto.idx"
 },
 "Drosophila Melanogaster" => {
   "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster.bowtie2.tar",
   "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster.hisat2.tar",
   "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster.kallisto.idx"
 },
 "Gray Whale" => {
   "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale.bowtie2.tar",
   "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale.hisat2.tar",
   "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale.kallisto.idx"
 },
 "Pea Aphid" => {
   "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid.bowtie2.tar",
   "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid.hisat2.tar",
   "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid.kallisto.idx"
 },
}

class AddNewHostGenomeFilesToRemainingHosts < ActiveRecord::Migration[6.1]
  def up
    NEW_INDEXES.keys.each do |hg_name|
      hg = HostGenome.find_by(name: hg_name)
      return unless hg
      hg.s3_bowtie2_index_path_v2 = NEW_INDEXES[hg_name]["s3_bowtie2_index_path_v2"]
      hg.s3_hisat2_index_path = NEW_INDEXES[hg_name]["s3_hisat2_index_path"]
      hg.s3_kallisto_index_path = NEW_INDEXES[hg_name]["s3_kallisto_index_path"]
      hg.save!
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end