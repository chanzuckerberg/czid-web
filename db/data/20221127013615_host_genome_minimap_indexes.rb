# frozen_string_literal: true

class HostGenomeMinimapIndexes < ActiveRecord::Migration[6.1]
  INDEXES_BY_S3_PREFIX = {
    "s3://czid-public-references/host_filter/ascomycetes/2021-06-14" => {
      "dna" => "s3://czid-public-references/host_filter/ascomycetes/2021-06-14/ascomycetes_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/ascomycetes/2021-06-14/ascomycetes_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/bank_vole/2019-07-24" => {
      "dna" => "s3://czid-public-references/host_filter/bank_vole/2019-07-24/bank_vole_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/bank_vole/2019-07-24/bank_vole_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/barred_hamlet/2019-12-17" => {
      "dna" => "s3://czid-public-references/host_filter/barred_hamlet/2019-12-17/barred_hamlet_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/barred_hamlet/2019-12-17/barred_hamlet_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/bat/2019-07-02" => {
      "dna" => "s3://czid-public-references/host_filter/bat/2019-07-02/bat_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/bat/2019-07-02/bat_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/bee/2019-04-25" => {
      "dna" => "s3://czid-public-references/host_filter/bee/2019-04-25/bee_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/bee/2019-04-25/bee_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29" => {
      "dna" => "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29/boechera_stricta_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29/boechera_stricta_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/c.elegans/2019-02-19" => {
      "dna" => "s3://czid-public-references/host_filter/c.elegans/2019-02-19/c.elegans_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/c.elegans/2019-02-19/c.elegans_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/carp/2019-04-17" => {
      "dna" => "s3://czid-public-references/host_filter/carp/2019-04-17/carp_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/carp/2019-04-17/carp_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/cat_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/cat_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/chicken/2019-04-18" => {
      "dna" => "s3://czid-public-references/host_filter/chicken/2019-04-18/chicken_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/chicken/2019-04-18/chicken_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/cicada/2021-07-28" => {
      "dna" => "s3://czid-public-references/host_filter/cicada/2021-07-28/cicada_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/cicada/2021-07-28/cicada_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/dog/2021-03-12" => {
      "dna" => "s3://czid-public-references/host_filter/dog/2021-03-12/dog_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/dog/2021-03-12/dog_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/european-woodmouse/2021-10-26" => {
      "dna" => "s3://czid-public-references/host_filter/european-woodmouse/2021-10-26/european-woodmouse_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/european-woodmouse/2021-10-26/european-woodmouse_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/field_vole/2019-07-24" => {
      "dna" => "s3://czid-public-references/host_filter/field_vole/2019-07-24/field_vole_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/field_vole/2019-07-24/field_vole_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/horse/2019-09-30" => {
      "dna" => "s3://czid-public-references/host_filter/horse/2019-09-30/horse_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/horse/2019-09-30/horse_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/koala/2021-03-12" => {
      "dna" => "s3://czid-public-references/host_filter/koala/2021-03-12/koala_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/koala/2021-03-12/koala_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/large-japanese-fieldmouse/2021-10-26" => {
      "dna" => "s3://czid-public-references/host_filter/large-japanese-fieldmouse/2021-10-26/large-japanese-fieldmouse_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/large-japanese-fieldmouse/2021-10-26/large-japanese-fieldmouse_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/madagascan_flying_fox/2021-03-05" => {
      "dna" => "s3://czid-public-references/host_filter/madagascan_flying_fox/2021-03-05/madagascan_flying_fox_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/madagascan_flying_fox/2021-03-05/madagascan_flying_fox_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/madagascan_fruit_bat/2021-03-05" => {
      "dna" => "s3://czid-public-references/host_filter/madagascan_fruit_bat/2021-03-05/madagascan_fruit_bat_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/madagascan_fruit_bat/2021-03-05/madagascan_fruit_bat_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/madagascan_rousettes/2021-03-05" => {
      "dna" => "s3://czid-public-references/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/mosquitos/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/mosquitos/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/mosquitos_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/mosquitos/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/mosquitos_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/mosquitos/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/mosquitos/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/mosquitos_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/mosquitos/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/mosquitos_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/mosquitos/2019-09-30" => {
      "dna" => "s3://czid-public-references/host_filter/mosquitos/2019-09-30/mosquitos_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/mosquitos/2019-09-30/mosquitos_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/mosquitos/2019-10-02" => {
      "dna" => "s3://czid-public-references/host_filter/mosquitos/2019-10-02/mosquitos_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/mosquitos/2019-10-02/mosquitos_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0" => {
      "dna" => "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0/myotis_lucifugus_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0/myotis_lucifugus_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/orange_clownfish/2019-12-17" => {
      "dna" => "s3://czid-public-references/host_filter/orange_clownfish/2019-12-17/orange_clownfish_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/orange_clownfish/2019-12-17/orange_clownfish_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/pig/2019-02-06" => {
      "dna" => "s3://czid-public-references/host_filter/pig/2019-02-06/pig_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/pig/2019-02-06/pig_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/rabbit/2019-07-24" => {
      "dna" => "s3://czid-public-references/host_filter/rabbit/2019-07-24/rabbit_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/rabbit/2019-07-24/rabbit_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/rat/2019-07-24" => {
      "dna" => "s3://czid-public-references/host_filter/rat/2019-07-24/rat_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/rat/2019-07-24/rat_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/salpingoeca_rosetta/2019-05-13" => {
      "dna" => "s3://czid-public-references/host_filter/salpingoeca_rosetta/2019-05-13/salpingoeca_rosetta_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/salpingoeca_rosetta/2019-05-13/salpingoeca_rosetta_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/songbird/2021-08-02" => {
      "dna" => "s3://czid-public-references/host_filter/songbird/2021-08-02/songbird_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/songbird/2021-08-02/songbird_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/soybean/2022-02-07" => {
      "dna" => "s3://czid-public-references/host_filter/soybean/2022-02-07/soybean_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/soybean/2022-02-07/soybean_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/spiny_mouse/2019-07-24" => {
      "dna" => "s3://czid-public-references/host_filter/spiny_mouse/2019-07-24/spiny_mouse_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/spiny_mouse/2019-07-24/spiny_mouse_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/taurine_cattle/2019-09-30" => {
      "dna" => "s3://czid-public-references/host_filter/taurine_cattle/2019-09-30/taurine_cattle_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/taurine_cattle/2019-09-30/taurine_cattle_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/ticks/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/ticks/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ticks_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/ticks/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ticks_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/ticks/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/ticks/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/ticks_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/ticks/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/ticks_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/tiger_tail_seahorse/2019-12-17" => {
      "dna" => "s3://czid-public-references/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/torafugu/2019-12-17" => {
      "dna" => "s3://czid-public-references/host_filter/torafugu/2019-12-17/torafugu_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/torafugu/2019-12-17/torafugu_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/turkey/2019-09-30" => {
      "dna" => "s3://czid-public-references/host_filter/turkey/2019-09-30/turkey_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/turkey/2019-09-30/turkey_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/water_buffalo/2019-09-30" => {
      "dna" => "s3://czid-public-references/host_filter/water_buffalo/2019-09-30/water_buffalo_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/water_buffalo/2019-09-30/water_buffalo_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/white_shrimp/2020-09-22" => {
      "dna" => "s3://czid-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0" => {
      "dna" => "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/mosquitos/2018-12-07-utc-1544400000-unixtime__2018-12-10-utc-1544467230-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/mosquitos/2018-12-07-utc-1544400000-unixtime__2018-12-10-utc-1544467230-unixtime/mosquito_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/mosquitos/2018-12-07-utc-1544400000-unixtime__2018-12-10-utc-1544467230-unixtime/mosquito_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime/mouse_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime/mouse_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/ercc/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/ercc/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/ercc_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/ercc/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/ercc_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/human/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/human/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/human_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/human/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/human_minimap2_genome_rna.mmi",
    },
    "s3://czid-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime" => {
      "dna" => "s3://czid-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/human_minimap2_genome_dna.mmi",
      "rna" => "s3://czid-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/human_minimap2_genome_rna.mmi",
    },
  }

  def up
    HostGenome.all.each do |hg|
      s3_prefix = Pathname.new(hg.s3_star_index_path).dirname.to_s.sub("idseq-public-references", "czid-public-references")
      index_s3_paths = INDEXES_BY_S3_PREFIX[s3_prefix]
      if index_s3_paths
        hg.s3_minimap2_dna_index_path = index_s3_paths["dna"]
        hg.s3_minimap2_rna_index_path = index_s3_paths["rna"]
        hg.save!
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
