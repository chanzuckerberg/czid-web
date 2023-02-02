# frozen_string_literal: true
INDEXES_BY_HOST_GENOME_NAME = {
  "ascomycetes" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/ascomycetes/20221031/original_transcripts_gtf_gz/Coccidioides_immitis_rmscc_3703_gca_000150085.ASM15008v1.55.gtf.gz"
  },
  "bee" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/bee/20221031/original_transcripts_gtf_gz/Anopheles_gambiae.AgamP4.55.gtf.gz"
  },
  "c.elegans" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/c.elegans/20221031/original_transcripts_gtf_gz/Caenorhabditis_elegans.WBcel235.108.gtf.gz"
  },
  "carp" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/carp/20221031/original_transcripts_gtf_gz/Cyprinus_carpio_carpio.Cypcar_WagV4.0.108.gtf.gz"
  },
  "cat" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/cat/20221031/original_transcripts_gtf_gz/Felis_catus.Felis_catus_9.0.108.gtf.gz"
  },
  "chicken" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/chicken/20221031/original_transcripts_gtf_gz/Gallus_gallus.bGalGal1.mat.broiler.GRCg7b.108.gtf.gz"
  },
  "dog" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/dog/20221031/original_transcripts_gtf_gz/Canis_lupus_familiaris.ROS_Cfam_1.0.108.gtf.gz"
  },
  "horse" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/horse/20221031/original_transcripts_gtf_gz/Equus_caballus.EquCab3.0.108.gtf.gz"
  },
  "human" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/human/20221031/original_transcripts_gtf_gz/Homo_sapiens.GRCh38.94.gtf.gz"
  },
  "koala" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/koala/20221031/original_transcripts_gtf_gz/Phascolarctos_cinereus.phaCin_unsw_v4.1.108.gtf.gz"
  },
  "mosquito" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/mosquito/20221031/original_transcripts_gtf_gz/Anopheles_gambiae.AgamP4.55.gtf.gz"
  },
  "mouse" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/mouse/20221031/original_transcripts_gtf_gz/Mus_musculus.GRCm39.108.gtf.gz"
  },
  "myotis lucifugus" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/myotis_lucifugus/20221031/original_transcripts_gtf_gz/Myotis_lucifugus.Myoluc2.0.108.gtf.gz"
  },
  "orange clownfish" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/orange_clownfish/20221031/original_transcripts_gtf_gz/Amphiprion_percula.Nemo_v1.108.gtf.gz"
  },
  "pig" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/pig/20221031/original_transcripts_gtf_gz/Sus_scrofa.Sscrofa11.1.108.gtf.gz"
  },
  "rabbit" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/rabbit/20221031/original_transcripts_gtf_gz/Oryctolagus_cuniculus.OryCun2.0.108.gtf.gz"
  },
  "rat" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/rat/20221031/original_transcripts_gtf_gz/Rattus_norvegicus.mRatBN7.2.108.gtf.gz"
  },
  "salpingoeca rosetta" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/original_transcripts_gtf_gz/Salpingoeca_rosetta_gca_000188695.Proterospongia_sp_ATCC50818.55.gtf.gz"
  },
  "soybean" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/soybean/20221031/original_transcripts_gtf_gz/Glycine_max.Glycine_max_v2.1.55.gtf.gz"
  },
  "taurine cattle" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/taurine_cattle/20221031/original_transcripts_gtf_gz/Bos_taurus.ARS-UCD1.2.108.gtf.gz"
  },
  "tiger tail seahorse" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/original_transcripts_gtf_gz/Hippocampus_comes.H_comes_QL1_v1.108.gtf.gz"
  },
  "torafugu" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/torafugu/20221031/original_transcripts_gtf_gz/Takifugu_rubripes.fTakRub1.2.108.gtf.gz"
  },
  "turkey" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/turkey/20221031/original_transcripts_gtf_gz/Meleagris_gallopavo.Turkey_5.1.108.gtf.gz"
  },
  "zebra fish" => {
    :s3_original_transcripts_gtf_index_path => "s3://czid-public-references/host_filter/zebra_fish/20221031/original_transcripts_gtf_gz/Danio_rerio.GRCz11.108.gtf.gz"
  }
}

class PopulateGtfIndexColumnOnHostGenomes < ActiveRecord::Migration[6.1]
  def up
    INDEXES_BY_HOST_GENOME_NAME.keys.each do |hg_name|
      hg = HostGenome.find_by(name: hg_name)

      unless hg
        puts "Host Genome #{hg_name} not found" 
        next
      end

      hg.update(
        :s3_original_transcripts_gtf_index_path => INDEXES_BY_HOST_GENOME_NAME[hg_name][:s3_original_transcripts_gtf_index_path],
      )
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
