# frozen_string_literal: true

class AddNewHostGenomeIndexPaths < ActiveRecord::Migration[6.1]
  INDEXES_BY_HOST_GENOME_NAME = {
    "ascomycetes" => {
      "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/ascomycetes/20221031/bowtie2_index_tar/ascomycetes.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/ascomycetes/20221031/hisat2_index_tar/ascomycetes.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/ascomycetes/20221031/kallisto_idx/ascomycetes.kallisto.idx"
    },
    "bank vole"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/bank_vole/20221031/bowtie2_index_tar/bank_vole.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/bank_vole/20221031/hisat2_index_tar/bank_vole.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/bank_vole/20221031/kallisto_idx/bank_vole.kallisto.idx"},
    "barred hamlet"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/barred_hamlet/20221031/bowtie2_index_tar/barred_hamlet.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/barred_hamlet/20221031/hisat2_index_tar/barred_hamlet.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/barred_hamlet/20221031/kallisto_idx/barred_hamlet.kallisto.idx"},
    "bat"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/bat/20221031/bowtie2_index_tar/bat.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/bat/20221031/hisat2_index_tar/bat.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/bat/20221031/kallisto_idx/bat.kallisto.idx"},
    "bee"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/bee/20221031/bowtie2_index_tar/bee.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/bee/20221031/hisat2_index_tar/bee.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/bee/20221031/kallisto_idx/bee.kallisto.idx"},
    "boechera stricta"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/boechera_stricta/20221031/bowtie2_index_tar/boechera_stricta.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/boechera_stricta/20221031/hisat2_index_tar/boechera_stricta.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/boechera_stricta/20221031/kallisto_idx/boechera_stricta.kallisto.idx"},
    "c.elegans"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/c.elegans/20221031/bowtie2_index_tar/c.elegans.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/c.elegans/20221031/hisat2_index_tar/c.elegans.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/c.elegans/20221031/kallisto_idx/c.elegans.kallisto.idx"},
    "carp"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/carp/20221031/bowtie2_index_tar/carp.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/carp/20221031/hisat2_index_tar/carp.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/carp/20221031/kallisto_idx/carp.kallisto.idx"},
    "cat"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/cat/20221031/bowtie2_index_tar/cat.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/cat/20221031/hisat2_index_tar/cat.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/cat/20221031/kallisto_idx/cat.kallisto.idx"},
    "chicken"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/chicken/20221031/bowtie2_index_tar/chicken.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/chicken/20221031/hisat2_index_tar/chicken.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/chicken/20221031/kallisto_idx/chicken.kallisto.idx"},
    "cicada"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/cicada/20221031/bowtie2_index_tar/cicada.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/cicada/20221031/hisat2_index_tar/cicada.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/cicada/20221031/kallisto_idx/cicada.kallisto.idx"},
    "dog"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/dog/20221031/bowtie2_index_tar/dog.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/dog/20221031/hisat2_index_tar/dog.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/dog/20221031/kallisto_idx/dog.kallisto.idx"},
    "ercc only"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx"},
    "european woodmouse"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/european-woodmouse/20221031/bowtie2_index_tar/european-woodmouse.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/european-woodmouse/20221031/hisat2_index_tar/european-woodmouse.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/european-woodmouse/20221031/kallisto_idx/european-woodmouse.kallisto.idx"},
    "field vole"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/field_vole/20221031/bowtie2_index_tar/field_vole.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/field_vole/20221031/hisat2_index_tar/field_vole.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/field_vole/20221031/kallisto_idx/field_vole.kallisto.idx"},
    "horse"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/horse/20221031/bowtie2_index_tar/horse.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/horse/20221031/hisat2_index_tar/horse.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/horse/20221031/kallisto_idx/horse.kallisto.idx"},
    "human"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/human/20221031/bowtie2_index_tar/human.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/human/20221031/hisat2_index_tar/human.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/human/20221031/kallisto_idx/human.kallisto.idx"},
    "koala"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/koala/20221031/bowtie2_index_tar/koala.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/koala/20221031/hisat2_index_tar/koala.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/koala/20221031/kallisto_idx/koala.kallisto.idx"},
    "large japanese fieldmouse"=>
      {"s3_bowtie2_index_path_v2"=>
        "s3://czid-public-references/host_filter/large-japanese-fieldmouse/20221031/bowtie2_index_tar/large-japanese-fieldmouse.bowtie2.tar",
      "s3_hisat2_index_path"=>
        "s3://czid-public-references/host_filter/large-japanese-fieldmouse/20221031/hisat2_index_tar/large-japanese-fieldmouse.hisat2.tar",
      "s3_kallisto_index_path"=>
        "s3://czid-public-references/host_filter/large-japanese-fieldmouse/20221031/kallisto_idx/large-japanese-fieldmouse.kallisto.idx"},
    "madagascan flying fox"=>
      {"s3_bowtie2_index_path_v2"=>
        "s3://czid-public-references/host_filter/madagascan_flying_fox/20221031/bowtie2_index_tar/madagascan_flying_fox.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/madagascan_flying_fox/20221031/hisat2_index_tar/madagascan_flying_fox.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/madagascan_flying_fox/20221031/kallisto_idx/madagascan_flying_fox.kallisto.idx"},
    "madagascan fruit bat"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/madagascan_fruit_bat/20221031/bowtie2_index_tar/madagascan_fruit_bat.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/madagascan_fruit_bat/20221031/hisat2_index_tar/madagascan_fruit_bat.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/madagascan_fruit_bat/20221031/kallisto_idx/madagascan_fruit_bat.kallisto.idx"},
    "madagascan rousettes"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/madagascan_rousettes/20221031/bowtie2_index_tar/madagascan_rousettes.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/madagascan_rousettes/20221031/hisat2_index_tar/madagascan_rousettes.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/madagascan_rousettes/20221031/kallisto_idx/madagascan_rousettes.kallisto.idx"},
    "mosquito"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/mosquito/20221031/bowtie2_index_tar/mosquito.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/mosquito/20221031/hisat2_index_tar/mosquito.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/mosquito/20221031/kallisto_idx/mosquito.kallisto.idx"},
    "mouse"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/mouse/20221031/bowtie2_index_tar/mouse.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/mouse/20221031/hisat2_index_tar/mouse.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/mouse/20221031/kallisto_idx/mouse.kallisto.idx"},
    "litle brown bat"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/myotis_lucifugus/20221031/bowtie2_index_tar/myotis_lucifugus.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/myotis_lucifugus/20221031/hisat2_index_tar/myotis_lucifugus.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/myotis_lucifugus/20221031/kallisto_idx/myotis_lucifugus.kallisto.idx"},
    "orange clownfish"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/orange_clownfish/20221031/bowtie2_index_tar/orange_clownfish.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/orange_clownfish/20221031/hisat2_index_tar/orange_clownfish.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/orange_clownfish/20221031/kallisto_idx/orange_clownfish.kallisto.idx"},
    "pig"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/pig/20221031/bowtie2_index_tar/pig.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/pig/20221031/hisat2_index_tar/pig.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/pig/20221031/kallisto_idx/pig.kallisto.idx"},
    "rabbit"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/rabbit/20221031/bowtie2_index_tar/rabbit.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/rabbit/20221031/hisat2_index_tar/rabbit.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/rabbit/20221031/kallisto_idx/rabbit.kallisto.idx"},
    "rat"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/rat/20221031/bowtie2_index_tar/rat.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/rat/20221031/hisat2_index_tar/rat.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/rat/20221031/kallisto_idx/rat.kallisto.idx"},
    "salpingoeca rosetta"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/bowtie2_index_tar/salpingoeca_rosetta.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/hisat2_index_tar/salpingoeca_rosetta.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/kallisto_idx/salpingoeca_rosetta.kallisto.idx"},
    "songbird"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/songbird/20221031/bowtie2_index_tar/songbird.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/songbird/20221031/hisat2_index_tar/songbird.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/songbird/20221031/kallisto_idx/songbird.kallisto.idx"},
    "soybean"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/soybean/20221031/bowtie2_index_tar/soybean.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/soybean/20221031/hisat2_index_tar/soybean.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/soybean/20221031/kallisto_idx/soybean.kallisto.idx"},
    "spiny mouse"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/spiny_mouse/20221031/bowtie2_index_tar/spiny_mouse.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/spiny_mouse/20221031/hisat2_index_tar/spiny_mouse.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/spiny_mouse/20221031/kallisto_idx/spiny_mouse.kallisto.idx"},
    "taurine cattle"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/taurine_cattle/20221031/bowtie2_index_tar/taurine_cattle.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/taurine_cattle/20221031/hisat2_index_tar/taurine_cattle.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/taurine_cattle/20221031/kallisto_idx/taurine_cattle.kallisto.idx"},
    "tick"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/ticks/20221031/bowtie2_index_tar/ticks.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/ticks/20221031/hisat2_index_tar/ticks.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/ticks/20221031/kallisto_idx/ticks.kallisto.idx"},
    "tiger tail seahorse"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/bowtie2_index_tar/tiger_tail_seahorse.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/hisat2_index_tar/tiger_tail_seahorse.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/kallisto_idx/tiger_tail_seahorse.kallisto.idx"},
    "torafugu"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/torafugu/20221031/bowtie2_index_tar/torafugu.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/torafugu/20221031/hisat2_index_tar/torafugu.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/torafugu/20221031/kallisto_idx/torafugu.kallisto.idx"},
    "turkey"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/turkey/20221031/bowtie2_index_tar/turkey.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/turkey/20221031/hisat2_index_tar/turkey.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/turkey/20221031/kallisto_idx/turkey.kallisto.idx"},
    "water buffalo"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/water_buffalo/20221031/bowtie2_index_tar/water_buffalo.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/water_buffalo/20221031/hisat2_index_tar/water_buffalo.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/water_buffalo/20221031/kallisto_idx/water_buffalo.kallisto.idx"},
    "white shrimp"=>
      {"s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/white_shrimp/20221031/bowtie2_index_tar/white_shrimp.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/white_shrimp/20221031/hisat2_index_tar/white_shrimp.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/white_shrimp/20221031/kallisto_idx/white_shrimp.kallisto.idx"},
    "wrasse" => {
      "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/wrasse/20221031/bowtie2_index_tar/wrasse.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/wrasse/20221031/hisat2_index_tar/wrasse.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/wrasse/20221031/kallisto_idx/wrasse.kallisto.idx"
    },
    "zebra fish" => {
      "s3_bowtie2_index_path_v2"=>"s3://czid-public-references/host_filter/zebra_fish/20221031/bowtie2_index_tar/zebra_fish.bowtie2.tar",
      "s3_hisat2_index_path"=>"s3://czid-public-references/host_filter/zebra_fish/20221031/hisat2_index_tar/zebra_fish.hisat2.tar",
      "s3_kallisto_index_path"=>"s3://czid-public-references/host_filter/zebra_fish/20221031/kallisto_idx/zebra_fish.kallisto.idx"
    }
  }

  def up
    INDEXES_BY_HOST_GENOME_NAME.keys.each do |hg_name|
      hg = HostGenome.find_by(name: hg_name)

      unless hg
        puts "Host Genome #{hg_name} not found" 
        next
      end

      hg.update(
        :s3_bowtie2_index_path_v2 => INDEXES_BY_HOST_GENOME_NAME[hg_name]["s3_bowtie2_index_path_v2"],
        :s3_hisat2_index_path => INDEXES_BY_HOST_GENOME_NAME[hg_name]["s3_hisat2_index_path"],
        :s3_kallisto_index_path => INDEXES_BY_HOST_GENOME_NAME[hg_name]["s3_kallisto_index_path"]
      )
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
