class AddAdditionalHostGenomes < SeedMigration::Migration
  def up
    # db/data/20240328165054_add_host_genome_riptortus_pedestris.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Riptortus pedestris - bean bug",
      s3_star_index_path: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 0,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/riptortus_pedestris/2024-03-28/host-genome-generation-1/riptortus_pedestris.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )

    # db/data/20240328165231_add_host_genome_photinus_pyralis.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Photinus pyralis - common eastern firefly",
      s3_star_index_path: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 0,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/photinus_pyralis/2024-03-28/host-genome-generation-1/photinus_pyralis.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )

    # db/data/20240417191002_add_host_genome_oncorhynchus_mykiss.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Oncorhynchus mykiss - rainbow trout",
      s3_star_index_path: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 1,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/oncorhynchus_mykiss/2024-04-17/host-genome-generation-1/oncorhynchus_mykiss.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )

    # db/data/20240424093234_add_host_genome_lemur_catta.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Lemur catta - ring-tailed lemur",
      s3_star_index_path: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 1,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/lemur_catta/2024-04-23/host-genome-generation-1/lemur_catta.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )

    # db/data/20240424093600_add_host_genome_pan_paniscus.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Pan paniscus - bonobo",
      s3_star_index_path: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 1,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/pan_paniscus/2024-04-23/host-genome-generation-1/pan_paniscus.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )

    # db/data/20240501181312_add_host_genome_rhinopithecus_bieti.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Rhinopithecus bieti - black snub-nosed monkey",
      s3_star_index_path: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 1,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/rhinopithecus_bieti/2024-05-01/host-genome-generation-1/rhinopithecus_bieti.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )

    # db/data/20240502103222_add_host_genome_gorilla_beringei.rb
    FactoryBot.find_or_create(
      :host_genome,
      name: "Gorilla beringei - eastern gorilla",
      s3_star_index_path: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei.bowtie2.tar",
      default_background_id: nil,
      skip_deutero_filter: 1,
      taxa_category: "unknown",
      samples_count: 0,
      user_id: nil,
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei_rna.mmi",
      s3_hisat2_index_path: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei.hisat2.tar",
      s3_kallisto_index_path: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei.kallisto.idx",
      s3_bowtie2_index_path_v2: "s3://czid-public-references/host_filter/gorilla_beringei/2024-05-01/host-genome-generation-1/gorilla_beringei.bowtie2.tar",
      s3_original_transcripts_gtf_index_path: nil,
      deprecation_status: nil,
      version: 1
    )
  end

  def down
    HostGenome.where(
      name: [
        "Riptortus pedestris - bean bug",
        "Photinus pyralis - common eastern firefly",
        "Oncorhynchus mykiss - rainbow trout",
        "Lemur catta - ring-tailed lemur",
        "Pan paniscus - bonobo",
        "Rhinopithecus bieti - black snub-nosed monkey",
        "Gorilla beringei - eastern gorilla"
      ]
    ).destroy_all
  end
end
