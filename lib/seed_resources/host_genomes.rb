require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class HostGenomes < Base
    def seed
      # Updated in db/data/20240123215713_create_t2t_human_for_testing_db.rb
      # When version 2 of the human genome was introduced, the original human genome was copied into a new entry,
      # and the fields of the original entry were updated to point to the new version.
      # This was done to preserve the samples_count field
      # To maintain consistency with other environments, that's why version 2 is being created first
      FactoryBot.find_or_create(
        :host_genome,
        name: "Human",
        s3_star_index_path: "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.bowtie2.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "human",
        samples_count: 7701,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/human/20230601/kallisto_idx/human.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/human_telomere/2023-07-05/host-genome-generation-1/human_telomere.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 2
      )

      # No original migration file found
      FactoryBot.find_or_create(
        :host_genome,
        name: "Mosquito",
        s3_star_index_path: "s3://idseq-public-references/host_filter/mosquitos/2019-10-02/mosquito_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/mosquitos/2019-10-02/mosquito_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 1,
        taxa_category: "insect",
        samples_count: 112,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/mosquitos/2019-10-02/mosquitos_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/mosquitos/2019-10-02/mosquitos_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/mosquito/20221031/hisat2_index_tar/mosquito.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/mosquito/20221031/kallisto_idx/mosquito.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/mosquito/20221031/bowtie2_index_tar/mosquito.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/mosquito/20221031/original_transcripts_gtf_gz/Anopheles_gambiae.AgamP4.55.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # No original migration file found, updated in db/data/20230426121019_add_host_genome_tick.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Tick",
        s3_star_index_path: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "insect",
        samples_count: 45,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/tick/2023-04-26/host-genome-generation-1/tick.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # No original migration file found for ERCC only
      FactoryBot.find_or_create(
        :host_genome,
        name: "ERCC only",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 60,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # No original migration file found
      FactoryBot.find_or_create(
        :host_genome,
        name: "Mouse",
        s3_star_index_path: "s3://idseq-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 64,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime/mouse_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/mouse/2018-08-10-utc-1518652800-unixtime__2018-08-10-utc-1518652800-unixtime/mouse_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/mouse/20221031/hisat2_index_tar/mouse.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/mouse/20221031/kallisto_idx/mouse.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/mouse/20221031/bowtie2_index_tar/mouse.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: "s3://czid-public-references/host_filter/mouse/20221031/original_transcripts_gtf_gz/Mus_musculus.GRCm39.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20181207202634_add_cat_genome.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Cat",
        s3_star_index_path: "s3://idseq-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 116,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/cat_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/cat_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/cat/20221031/hisat2_index_tar/cat.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/cat/20221031/kallisto_idx/cat.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/cat/20221031/bowtie2_index_tar/cat.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/cat/20221031/original_transcripts_gtf_gz/Felis_catus.Felis_catus_9.0.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # No original migration file found for Pig
      FactoryBot.find_or_create(
        :host_genome,
        name: "Pig",
        s3_star_index_path: "s3://idseq-public-references/host_filter/pig/2019-02-06/STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/pig/2019-02-06/bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 212,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/pig/2019-02-06/pig_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/pig/2019-02-06/pig_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/pig/20221031/hisat2_index_tar/pig.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/pig/20221031/kallisto_idx/pig.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/pig/20221031/bowtie2_index_tar/pig.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/pig/20221031/original_transcripts_gtf_gz/Sus_scrofa.Sscrofa11.1.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # No original migration file found for C.elegans
      FactoryBot.find_or_create(
        :host_genome,
        name: "C.elegans",
        s3_star_index_path: "s3://idseq-public-references/host_filter/c.elegans/2019-02-19/STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/c.elegans/2019-02-19/bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 1,
        taxa_category: "non-human-animal",
        samples_count: 15,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/c.elegans/2019-02-19/c.elegans_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/c.elegans/2019-02-19/c.elegans_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/c.elegans/20221031/hisat2_index_tar/c.elegans.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/c.elegans/20221031/kallisto_idx/c.elegans.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/c.elegans/20221031/bowtie2_index_tar/c.elegans.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/c.elegans/20221031/original_transcripts_gtf_gz/Caenorhabditis_elegans.WBcel235.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190417183014_add_carp_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Carp",
        s3_star_index_path: "s3://idseq-public-references/host_filter/carp/2019-04-17/STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/carp/2019-04-17/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 20,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/carp/2019-04-17/carp_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/carp/2019-04-17/carp_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/carp/20221031/hisat2_index_tar/carp.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/carp/20221031/kallisto_idx/carp.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/carp/20221031/bowtie2_index_tar/carp.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/carp/20221031/original_transcripts_gtf_gz/Cyprinus_carpio_carpio.Cypcar_WagV4.0.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190423182934_add_chicken_genome.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Chicken",
        s3_star_index_path: "s3://idseq-public-references/host_filter/chicken/2019-04-18/STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/chicken/2019-04-18/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 41,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/chicken/2019-04-18/chicken_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/chicken/2019-04-18/chicken_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/chicken/20221031/hisat2_index_tar/chicken.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/chicken/20221031/kallisto_idx/chicken.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/chicken/20221031/bowtie2_index_tar/chicken.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/chicken/20221031/original_transcripts_gtf_gz/Gallus_gallus.bGalGal1.mat.broiler.GRCg7b.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190426002714_add_bee_genome.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Bee",
        s3_star_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee.bowtie2.tar",
        default_background_id: 93,
        skip_deutero_filter: 1,
        taxa_category: "insect",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/bee/20221031/hisat2_index_tar/bee.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/bee/20221031/kallisto_idx/bee.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/bee/20221031/bowtie2_index_tar/bee.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/bee/20221031/original_transcripts_gtf_gz/Anopheles_gambiae.AgamP4.55.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190514162528_add_s_rosetta_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Salpingoeca rosetta",
        s3_star_index_path: "s3://idseq-public-references/host_filter/salpingoeca_rosetta/2019-05-13/s-rosetta_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/salpingoeca_rosetta/2019-05-13/s-rosetta_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 1,
        taxa_category: "non-human-animal",
        samples_count: 21,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/salpingoeca_rosetta/2019-05-13/salpingoeca_rosetta_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/salpingoeca_rosetta/2019-05-13/salpingoeca_rosetta_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/hisat2_index_tar/salpingoeca_rosetta.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/kallisto_idx/salpingoeca_rosetta.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/bowtie2_index_tar/salpingoeca_rosetta.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/salpingoeca_rosetta/20221031/original_transcripts_gtf_gz/Salpingoeca_rosetta_gca_000188695.Proterospongia_sp_ATCC50818.55.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190708183858_add_bat_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Bat",
        s3_star_index_path: "s3://idseq-public-references/host_filter/bat/2019-07-02/bat_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/bat/2019-07-02/bat_bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/bat/2019-07-02/bat_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/bat/2019-07-02/bat_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/bat/20221031/hisat2_index_tar/bat.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/bat/20221031/kallisto_idx/bat.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/bat/20221031/bowtie2_index_tar/bat.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190725215533_add_rat_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Rat",
        s3_star_index_path: "s3://idseq-public-references/host_filter/rat/2019-07-24/rat_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/rat/2019-07-24/rat_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 48,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/rat/2019-07-24/rat_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/rat/2019-07-24/rat_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/rat/20221031/hisat2_index_tar/rat.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/rat/20221031/kallisto_idx/rat.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/rat/20221031/bowtie2_index_tar/rat.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/rat/20221031/original_transcripts_gtf_gz/Rattus_norvegicus.mRatBN7.2.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190725222854_add_field_vole_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Field Vole",
        s3_star_index_path: "s3://idseq-public-references/host_filter/field_vole/2019-07-24/field_vole_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/field_vole/2019-07-24/field_vole_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/field_vole/2019-07-24/field_vole_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/field_vole/2019-07-24/field_vole_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/field_vole/20221031/hisat2_index_tar/field_vole.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/field_vole/20221031/kallisto_idx/field_vole.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/field_vole/20221031/bowtie2_index_tar/field_vole.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20190725224942_add_bank_vole_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Bank Vole",
        s3_star_index_path: "s3://idseq-public-references/host_filter/bank_vole/2019-07-24/bank_vole_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/bank_vole/2019-07-24/bank_vole_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/bank_vole/2019-07-24/bank_vole_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/bank_vole/2019-07-24/bank_vole_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/bank_vole/20221031/hisat2_index_tar/bank_vole.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/bank_vole/20221031/kallisto_idx/bank_vole.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/bank_vole/20221031/bowtie2_index_tar/bank_vole.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Spiny Mouse host added in db/migrate/20190725225000_add_spiny_mouse_host.rb
      # but subsequently removed in db/migrate/20190731231625_remove_spiny_mouse_host.rb

      # Originally added in db/migrate/20190725225016_add_rabbit_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Rabbit",
        s3_star_index_path: "s3://idseq-public-references/host_filter/rabbit/2019-07-24/rabbit_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/rabbit/2019-07-24/rabbit_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 20,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/rabbit/2019-07-24/rabbit_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/rabbit/2019-07-24/rabbit_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/rabbit/20221031/hisat2_index_tar/rabbit.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/rabbit/20221031/kallisto_idx/rabbit.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/rabbit/20221031/bowtie2_index_tar/rabbit.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/rabbit/20221031/original_transcripts_gtf_gz/Oryctolagus_cuniculus.OryCun2.0.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191001224342_add_new_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Water Buffalo",
        s3_star_index_path: "s3://idseq-public-references/host_filter/water_buffalo/2019-09-30/water_buffalo_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/water_buffalo/2019-09-30/water_buffalo_bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 9,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/water_buffalo/2019-09-30/water_buffalo_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/water_buffalo/2019-09-30/water_buffalo_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/water_buffalo/20221031/hisat2_index_tar/water_buffalo.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/water_buffalo/20221031/kallisto_idx/water_buffalo.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/water_buffalo/20221031/bowtie2_index_tar/water_buffalo.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191001224342_add_new_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Horse",
        s3_star_index_path: "s3://idseq-public-references/host_filter/horse/2019-09-30/horse_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/horse/2019-09-30/horse_bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/horse/2019-09-30/horse_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/horse/2019-09-30/horse_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/horse/20221031/hisat2_index_tar/horse.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/horse/20221031/kallisto_idx/horse.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/horse/20221031/bowtie2_index_tar/horse.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/horse/20221031/original_transcripts_gtf_gz/Equus_caballus.EquCab3.0.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191001224342_add_new_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Taurine Cattle",
        s3_star_index_path: "s3://idseq-public-references/host_filter/taurine_cattle/2019-09-30/taurine_cattle_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/taurine_cattle/2019-09-30/taurine_cattle_bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/taurine_cattle/2019-09-30/taurine_cattle_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/taurine_cattle/2019-09-30/taurine_cattle_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/taurine_cattle/20221031/hisat2_index_tar/taurine_cattle.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/taurine_cattle/20221031/kallisto_idx/taurine_cattle.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/taurine_cattle/20221031/bowtie2_index_tar/taurine_cattle.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/taurine_cattle/20221031/original_transcripts_gtf_gz/Bos_taurus.ARS-UCD1.2.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191001224342_add_new_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Turkey",
        s3_star_index_path: "s3://idseq-public-references/host_filter/turkey/2019-09-30/turkey_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/turkey/2019-09-30/turkey_bowtie2_genome.tar",
        default_background_id: 26,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/turkey/2019-09-30/turkey_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/turkey/2019-09-30/turkey_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/turkey/20221031/hisat2_index_tar/turkey.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/turkey/20221031/kallisto_idx/turkey.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/turkey/20221031/bowtie2_index_tar/turkey.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/turkey/20221031/original_transcripts_gtf_gz/Meleagris_gallopavo.Turkey_5.1.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191218220321_add_fish_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Barred Hamlet",
        s3_star_index_path: "s3://idseq-public-references/host_filter/barred_hamlet/2019-12-17/barred_hamlet_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/barred_hamlet/2019-12-17/barred_hamlet_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 10,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/barred_hamlet/2019-12-17/barred_hamlet_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/barred_hamlet/2019-12-17/barred_hamlet_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/barred_hamlet/20221031/hisat2_index_tar/barred_hamlet.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/barred_hamlet/20221031/kallisto_idx/barred_hamlet.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/barred_hamlet/20221031/bowtie2_index_tar/barred_hamlet.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191218220321_add_fish_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Orange Clownfish",
        s3_star_index_path: "s3://idseq-public-references/host_filter/orange_clownfish/2019-12-17/orange_clownfish_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/orange_clownfish/2019-12-17/orange_clownfish_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 21,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/orange_clownfish/2019-12-17/orange_clownfish_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/orange_clownfish/2019-12-17/orange_clownfish_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/orange_clownfish/20221031/hisat2_index_tar/orange_clownfish.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/orange_clownfish/20221031/kallisto_idx/orange_clownfish.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/orange_clownfish/20221031/bowtie2_index_tar/orange_clownfish.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/orange_clownfish/20221031/original_transcripts_gtf_gz/Amphiprion_percula.Nemo_v1.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191218220321_add_fish_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Tiger Tail Seahorse",
        s3_star_index_path: "s3://idseq-public-references/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 9,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/hisat2_index_tar/tiger_tail_seahorse.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/kallisto_idx/tiger_tail_seahorse.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/bowtie2_index_tar/tiger_tail_seahorse.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/tiger_tail_seahorse/20221031/original_transcripts_gtf_gz/Hippocampus_comes.H_comes_QL1_v1.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20191218220321_add_fish_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Torafugu",
        s3_star_index_path: "s3://idseq-public-references/host_filter/torafugu/2019-12-17/torafugu_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/torafugu/2019-12-17/torafugu_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 12,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/torafugu/2019-12-17/torafugu_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/torafugu/2019-12-17/torafugu_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/torafugu/20221031/hisat2_index_tar/torafugu.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/torafugu/20221031/kallisto_idx/torafugu.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/torafugu/20221031/bowtie2_index_tar/torafugu.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/torafugu/20221031/original_transcripts_gtf_gz/Takifugu_rubripes.fTakRub1.2.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Badger",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Batfish",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 15,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Bear",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 11,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Camel",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 6,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Chimpanzee",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Cow",
        s3_star_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
         "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 23,
        user_id: nil,
        s3_minimap2_dna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
         "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Dik Dik",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 9,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      # Updated in db/migrate/20210315192820_add_dog_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Dog",
        s3_star_index_path: "s3://idseq-public-references/host_filter/dog/2021-03-12/dog_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/dog/2021-03-12/dog_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/dog/2021-03-12/dog_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/dog/2021-03-12/dog_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/dog/20221031/hisat2_index_tar/dog.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/dog/20221031/kallisto_idx/dog.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/dog/20221031/bowtie2_index_tar/dog.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
        "s3://czid-public-references/host_filter/dog/20221031/original_transcripts_gtf_gz/Canis_lupus_familiaris.ROS_Cfam_1.0.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Donkey",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Ferret",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 21,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Fox",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 11,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Giraffe",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 13,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Goat",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 12,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Gorilla",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 15,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Guinea Pig",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Harbor Seal",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Hedgehog",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 12,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Kestrel",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 10,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Leopard",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 13,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Lion",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Llama",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Mallard",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 11,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Milu",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 19,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Monk Seal",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Monkey",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 7,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Owl",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 15,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Penguin",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 19,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Porpoise",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 15,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Prairie Dog",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 8,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Raccoon",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Sea Lion",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 15,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Seagull",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Seal",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Seastar",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 9,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Sloth",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Snake",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 10,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Stork",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 19,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Tiger",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200123221752_add_ercc_only_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Unknown",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 26,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/ercc_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20200922010000_add_white_shrimp_host_genome.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "White Shrimp",
        s3_star_index_path: "s3://idseq-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "non-human-animal",
        samples_count: 64,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/white_shrimp/20221031/hisat2_index_tar/white_shrimp.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/white_shrimp/20221031/kallisto_idx/white_shrimp.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/white_shrimp/20221031/bowtie2_index_tar/white_shrimp.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210315192528_add_koala_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Koala",
        s3_star_index_path: "s3://idseq-public-references/host_filter/koala/2021-03-12/koala_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/koala/2021-03-12/koala_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 27,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/koala/2021-03-12/koala_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/koala/2021-03-12/koala_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/koala/20221031/hisat2_index_tar/koala.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/koala/20221031/kallisto_idx/koala.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/koala/20221031/bowtie2_index_tar/koala.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/koala/20221031/original_transcripts_gtf_gz/Phascolarctos_cinereus.phaCin_unsw_v4.1.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210315192635_add_madagascan_flying_fox_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Madagascan Flying Fox",
        s3_star_index_path: "s3://idseq-public-references/host_filter/madagascan_flying_fox/2021-03-05/madagascan_flying_fox_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/madagascan_flying_fox/2021-03-05/madagascan_flying_fox_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 10,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/madagascan_flying_fox/2021-03-05/madagascan_flying_fox_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/madagascan_flying_fox/2021-03-05/madagascan_flying_fox_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/madagascan_flying_fox/20221031/hisat2_index_tar/madagascan_flying_fox.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/madagascan_flying_fox/20221031/kallisto_idx/madagascan_flying_fox.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/madagascan_flying_fox/20221031/bowtie2_index_tar/madagascan_flying_fox.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210315192723_add_madagascan_fruit_bat_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Madagascan Fruit Bat",
        s3_star_index_path: "s3://idseq-public-references/host_filter/madagascan_fruit_bat/2021-03-05/madagascan_fruit_bat_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/madagascan_fruit_bat/2021-03-05/madagascan_fruit_bat_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/madagascan_fruit_bat/2021-03-05/madagascan_fruit_bat_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/madagascan_fruit_bat/2021-03-05/madagascan_fruit_bat_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/madagascan_fruit_bat/20221031/hisat2_index_tar/madagascan_fruit_bat.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/madagascan_fruit_bat/20221031/kallisto_idx/madagascan_fruit_bat.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/madagascan_fruit_bat/20221031/bowtie2_index_tar/madagascan_fruit_bat.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210315192756_add_madagascan_rousettes_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Madagascan Rousettes",
        s3_star_index_path: "s3://idseq-public-references/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 456,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/madagascan_rousettes/20221031/hisat2_index_tar/madagascan_rousettes.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/madagascan_rousettes/20221031/kallisto_idx/madagascan_rousettes.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/madagascan_rousettes/20221031/bowtie2_index_tar/madagascan_rousettes.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210614220919_add_ascomycetes_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Ascomycetes",
        s3_star_index_path: "s3://idseq-public-references/host_filter/ascomycetes/2021-06-14/ascomycetes_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/ascomycetes/2021-06-14/ascomycetes_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/ascomycetes/2021-06-14/ascomycetes_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/ascomycetes/2021-06-14/ascomycetes_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ascomycetes/20221031/hisat2_index_tar/ascomycetes.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ascomycetes/20221031/kallisto_idx/ascomycetes.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ascomycetes/20221031/bowtie2_index_tar/ascomycetes.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
         "s3://czid-public-references/host_filter/ascomycetes/20221031/original_transcripts_gtf_gz/Coccidioides_immitis_rmscc_3703_gca_000150085.ASM15008v1.55.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210804004212_add_songbird_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Songbird",
        s3_star_index_path: "s3://idseq-public-references/host_filter/songbird/2021-08-02/songbird_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/songbird/2021-08-02/songbird_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 20,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/songbird/2021-08-02/songbird_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/songbird/2021-08-02/songbird_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/songbird/20221031/hisat2_index_tar/songbird.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/songbird/20221031/kallisto_idx/songbird.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/songbird/20221031/bowtie2_index_tar/songbird.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20210804175504_add_cicada_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Cicada",
        s3_star_index_path: "s3://idseq-public-references/host_filter/cicada/2021-07-28/cicada_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/cicada/2021-07-28/cicada_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/cicada/2021-07-28/cicada_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/cicada/2021-07-28/cicada_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/cicada/20221031/hisat2_index_tar/cicada.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/cicada/20221031/kallisto_idx/cicada.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/cicada/20221031/bowtie2_index_tar/cicada.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20211027162633_add_european_woodmouse_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "European Woodmouse",
        s3_star_index_path: "s3://idseq-public-references/host_filter/european-woodmouse/2021-10-26/european-woodmouse_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/european-woodmouse/2021-10-26/european-woodmouse_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 20,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/european-woodmouse/2021-10-26/european-woodmouse_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/european-woodmouse/2021-10-26/european-woodmouse_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/european-woodmouse/20221031/hisat2_index_tar/european-woodmouse.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/european-woodmouse/20221031/kallisto_idx/european-woodmouse.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/european-woodmouse/20221031/bowtie2_index_tar/european-woodmouse.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20211027162823_add_large_japanese_fieldmouse_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Large Japanese Fieldmouse",
        s3_star_index_path: "s3://idseq-public-references/host_filter/large-japanese-fieldmouse/2021-10-26/large-japanese-fieldmouse_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/large-japanese-fieldmouse/2021-10-26/large-japanese-fieldmouse_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 21,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/large-japanese-fieldmouse/2021-10-26/large-japanese-fieldmouse_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/large-japanese-fieldmouse/2021-10-26/large-japanese-fieldmouse_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/large-japanese-fieldmouse/20221031/hisat2_index_tar/large-japanese-fieldmouse.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/large-japanese-fieldmouse/20221031/kallisto_idx/large-japanese-fieldmouse.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/large-japanese-fieldmouse/20221031/bowtie2_index_tar/large-japanese-fieldmouse.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/migrate/20220208002644_add_soybean_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Soybean",
        s3_star_index_path: "s3://idseq-public-references/host_filter/soybean/2022-02-07/soybean_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/soybean/2022-02-07/soybean_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 20,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/soybean/2022-02-07/soybean_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/soybean/2022-02-07/soybean_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/soybean/20221031/hisat2_index_tar/soybean.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/soybean/20221031/kallisto_idx/soybean.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/soybean/20221031/bowtie2_index_tar/soybean.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: "s3://czid-public-references/host_filter/soybean/20221031/original_transcripts_gtf_gz/Glycine_max.Glycine_max_v2.1.55.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/data/20220804173907_add_boechera_stricta_to_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Boechera Stricta",
        s3_star_index_path: "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29/host-genome-generation-0/boechera_stricta_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29/host-genome-generation-0/boechera_stricta_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 23,
        user_id: nil,
        s3_minimap2_dna_index_path: nil,
        s3_minimap2_rna_index_path: nil,
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/boechera_stricta/20221031/hisat2_index_tar/boechera_stricta.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/boechera_stricta/20221031/kallisto_idx/boechera_stricta.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/boechera_stricta/20221031/bowtie2_index_tar/boechera_stricta.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/data/20220804174123_add_little_brown_bat_to_host_genomes.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Little Brown Bat",
        s3_star_index_path: "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0/myotis_lucifugus_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0/myotis_lucifugus_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0/myotis_lucifugus_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/myotis_lucifugus/2022-07-29/host-genome-generation-0/myotis_lucifugus_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # Originally added in db/data/20221013180914_add_zebra_fish_host.rb
      FactoryBot.find_or_create(
        :host_genome,
        name: "Zebra Fish",
        s3_star_index_path: "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 24,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/zebra_fish/20221031/hisat2_index_tar/zebra_fish.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/zebra_fish/20221031/kallisto_idx/zebra_fish.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/zebra_fish/20221031/bowtie2_index_tar/zebra_fish.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: "s3://czid-public-references/host_filter/zebra_fish/20221031/original_transcripts_gtf_gz/Danio_rerio.GRCz11.108.gtf.gz",
        deprecation_status: nil,
        version: 1
      )

      ##### START DATA MIGRATION HOST GENOMES #####
      # Below hosts were added in data migrations, starting from 20221202215227 through 20240326153544

      FactoryBot.find_or_create(
        :host_genome,
        name: "Pea Aphid",
        s3_star_index_path: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea_aphid_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 19,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea_aphid_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea_aphid_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/pea-aphid/2022-12-02/pea-aphid.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Chelonia Mydas",
        s3_star_index_path: "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/chelonia_mydas/2023-01-09/host-genome-generation-0/chelonia_mydas.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Drosophila Melanogaster",
        s3_star_index_path:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster_STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 21,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster_minimap2_genome_rna.mmi",
        s3_hisat2_index_path:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster.hisat2.tar",
        s3_kallisto_index_path:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster.kallisto.idx",
        s3_bowtie2_index_path_v2:
        "s3://czid-public-references/host_filter/drosophila_melanogaster/2023-01-19/host-genome-generation-0/drosophila_melanogaster.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Gray Whale",
        s3_star_index_path: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale_bowtie2_genome.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/gray_whale/2023-01-20/host-genome-generation-0/gray_whale.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Vicugna pacos - Alpaca",
        s3_star_index_path: "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos_{nucleotide_type}.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos_{nucleotide_type}.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/vicugna_pacos/2023-03-01/host-genome-generation-1/vicugna_pacos.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Turkey Vulture",
        s3_star_index_path: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/turkey_vulture/2023-04-17/host-genome-generation-1/turkey_vulture.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Sus scrofa - pig",
        s3_star_index_path: "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace.hisat2.tar",
        s3_kallisto_index_path:
        "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace.kallisto.idx",
        s3_bowtie2_index_path_v2:
        "s3://czid-public-references/host_filter/sus_scrofa_landrace/2023-06-07/host-genome-generation-1/sus_scrofa_landrace.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Macaca fascicularis - crab-eating macaque",
        s3_star_index_path: "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis.hisat2.tar",
        s3_kallisto_index_path:
        "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis.kallisto.idx",
        s3_bowtie2_index_path_v2:
        "s3://czid-public-references/host_filter/macaca_fascicularis/2023-06-08/host-genome-generation-1/macaca_fascicularis.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Macaca mulatta - Rhesus monkey",
        s3_star_index_path: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 10,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/macaca_mulatta/2023-06-08/host-genome-generation-1/macaca_mulatta.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Ovis aries - sheep",
        s3_star_index_path: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 12,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/ovis_aries/2023-06-20/host-genome-generation-1/ovis_aries.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Bubalus bubalis - water buffalo",
        s3_star_index_path: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 12,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/bubalus_bubalis/2023-06-20/host-genome-generation-1/bubalus_bubalis.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Arabidopsis thaliana - Thale cress",
        s3_star_index_path:
        "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana_STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 19,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana.hisat2.tar",
        s3_kallisto_index_path:
        "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana.kallisto.idx",
        s3_bowtie2_index_path_v2:
        "s3://czid-public-references/host_filter/arabidopsis_thaliana/2023-10-04/host-genome-generation-1/arabidopsis_thaliana.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Columba livia - Rock pigeon",
        s3_star_index_path: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/columba_livia/2023-10-04/host-genome-generation-1/columba_livia.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Pan troglodytes - chimpanzee",
        s3_star_index_path: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/pan_troglodytes/2023-10-04/host-genome-generation-1/pan_troglodytes.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Gorilla gorilla",
        s3_star_index_path: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/gorilla_gorilla/2023-10-04/host-genome-generation-1/gorilla_gorilla.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Pteropus vampyrus - large flying fox",
        s3_star_index_path: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 11,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/pteropus_vampyrus/2023-10-04/host-genome-generation-1/pteropus_vampyrus.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Onchocerca volvulus",
        s3_star_index_path: "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus.hisat2.tar",
        s3_kallisto_index_path:
        "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus.kallisto.idx",
        s3_bowtie2_index_path_v2:
        "s3://czid-public-references/host_filter/onchocerca_volvulus/2023-10-27/host-genome-generation-1/onchocerca_volvulus.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Buteo jamaicensis - red-tailed hawk",
        s3_star_index_path: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 14,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/buteo_jamaicensis/2023-11-17/host-genome-generation-1/buteo_jamaicensis.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Biting Midge",
        s3_star_index_path: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 17,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/biting_midge/2023-12-01/host-genome-generation-1/biting_midge.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Striped Dolphin",
        s3_star_index_path: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 16,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/striped_dolphin/2023-12-01/host-genome-generation-1/striped_dolphin.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Common Bottlenose Dolphin",
        s3_star_index_path: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 18,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/bottlenose_dolphin/2023-12-04/host-genome-generation-1/bottlenose_dolphin.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      # No original migration file found
      # Updated in db/data/20240123215713_create_t2t_human_for_testing_db.rb
      # This was the copy of the original human genome
      FactoryBot.find_or_create(
        :host_genome,
        name: "Human",
        s3_star_index_path:
        "s3://idseq-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/human_STAR_genome.tar",
        s3_bowtie2_index_path:
        "s3://idseq-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/human_bowtie2_genome.tar",
        default_background_id: 93,
        skip_deutero_filter: 0,
        taxa_category: "human",
        samples_count: 20,
        user_id: nil,
        s3_minimap2_dna_index_path:
        "s3://czid-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/human_minimap2_genome_dna.mmi",
        s3_minimap2_rna_index_path:
        "s3://czid-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/human_minimap2_genome_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/human/20221031/hisat2_index_tar/human.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/human/20230601/kallisto_idx/human.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/human/20221031/bowtie2_index_tar/human.bowtie2.tar",
        s3_original_transcripts_gtf_index_path:
        "s3://czid-public-references/host_filter/human/20230601/original_transcripts_gtf_gz/gencode.v43.annotation.gtf.gz",
        deprecation_status: "deprecated, 2023-12-13, v1, HG38",
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Olive baboon",
        s3_star_index_path: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/olive_baboon/2024-02-20/host-genome-generation-1/olive_baboon.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Garden Lettuce",
        s3_star_index_path: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/garden_lettuce/2024-03-05/host-genome-generation-1/garden_lettuce.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Watermelon",
        s3_star_index_path: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/watermelon/2024-03-05/host-genome-generation-1/watermelon.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Papaya",
        s3_star_index_path: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/papaya/2024-03-05/host-genome-generation-1/papaya.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Wild Cabbage",
        s3_star_index_path: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/wild_cabbage/2024-03-05/host-genome-generation-1/wild_cabbage.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Musk Melon",
        s3_star_index_path: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/muskmelon/2024-03-05/host-genome-generation-1/muskmelon.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Chinese Spinach",
        s3_star_index_path: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 0,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/chinese_spinach/2024-03-05/host-genome-generation-1/chinese_spinach.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      FactoryBot.find_or_create(
        :host_genome,
        name: "Salmo salar - Atlantic salmon",
        s3_star_index_path: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar.bowtie2.tar",
        default_background_id: nil,
        skip_deutero_filter: 1,
        taxa_category: "unknown",
        samples_count: 0,
        user_id: nil,
        s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar_dna.mmi",
        s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar_rna.mmi",
        s3_hisat2_index_path: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar.hisat2.tar",
        s3_kallisto_index_path: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar.kallisto.idx",
        s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/salmo_salar/2024-03-25/host-genome-generation-1/salmo_salar.bowtie2.tar",
        s3_original_transcripts_gtf_index_path: nil,
        deprecation_status: nil,
        version: 1
      )

      ##### END DATA MIGRATION HOST GENOMES #####
    end
  end
end
