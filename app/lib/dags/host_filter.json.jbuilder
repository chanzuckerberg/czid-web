json.name attr[:dag_name]

json.output_dir_s3 "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results"

json.targets do
  json.fastqs [attr[:fastq1], attr[:fastq2]].compact

  validate_input_out = ['validate_input_summary.json', "valid_input1.#{attr[:file_ext]}"]
  validate_input_out << "valid_input2.#{attr[:file_ext]}" if attr[:fastq2]
  json.validate_input_out validate_input_out

  star_out = ["unmapped1.#{attr[:file_ext]}"]
  star_out << "unmapped2.#{attr[:file_ext]}" if attr[:fastq2]
  json.star_out star_out

  trimmomatic_out = ["trimmomatic1.#{attr[:file_ext]}"]
  trimmomatic_out << "trimmomatic2.#{attr[:file_ext]}" if attr[:fastq2]
  json.trimmomatic_out trimmomatic_out

  priceseq_out = ['priceseq1.fa']
  priceseq_out << 'priceseq2.fa' if attr[:fastq2]
  json.priceseq_out priceseq_out

  cdhitdup_out = ['dedup1.fa']
  cdhitdup_out << 'dedup2.fa' if attr[:fastq2]
  json.cdhitdup_out cdhitdup_out

  lzw_out = ['lzw1.fa']
  lzw_out << 'lzw2.fa' if attr[:fastq2]
  json.lzw_out lzw_out

  bowtie2_out = ['bowtie2_1.fa']
  bowtie2_out += ['bowtie2_2.fa', 'bowtie2_merged.fa'] if attr[:fastq2]
  json.bowtie2_out bowtie2_out

  subsampled_out = ['subsampled_1.fa']
  subsampled_out += ['subsampled_2.fa', 'subsampled_merged.fa'] if attr[:fastq2]
  json.subsampled_out subsampled_out

  if attr[:host_genome] != 'human'
    star_human_out = ['unmapped_human_1.fa']
    star_human_out << 'unmapped_human_2.fa' if attr[:fastq2]
    json.star_human_out star_human_out

    bowtie2_human_out = ['bowtie2_human_1.fa']
    bowtie2_human_out += ['bowtie2_human_2.fa', 'bowtie2_human_merged.fa'] if attr[:fastq2]
    json.bowtie2_human_out bowtie2_human_out
  end

  gsnap_filter_out = ['gsnap_filter_1.fa']
  gsnap_filter_out += ['gsnap_filter_2.fa', 'gsnap_filter_merged.fa'] if attr[:fastq2]
  json.gsnap_filter_out gsnap_filter_out
end

json.steps do
  steps = []
  steps << {
    in: ['fastqs'],
    out: 'validate_input_out',
    class: 'PipelineStepRunValidateInput',
    module: 'idseq_dag.steps.run_validate_input',
    additional_files: {},
    additional_attributes: {
      truncate_fragments_to: attr[:max_fragments],
      file_ext: attr[:file_ext],
    },
  }
  steps << {
    in: ['validate_input_out'],
    out: 'star_out',
    class: 'PipelineStepRunStar',
    module: 'idseq_dag.steps.run_star',
    additional_files: { star_genome: attr[:star_genome] },
    additional_attributes: {
      output_gene_file: 'reads_per_gene.star.tab',
      nucleotide_type: attr[:nucleotide_type],
    },
  }
  steps << {
    in: ['star_out'],
    out: 'trimmomatic_out',
    class: 'PipelineStepRunTrimmomatic',
    module: 'idseq_dag.steps.run_trimmomatic',
    additional_files: { adapter_fasta: attr[:adapter_fasta] },
    additional_attributes: {},
  }
  steps << {
    in: ['trimmomatic_out'],
    out: 'priceseq_out',
    class: 'PipelineStepRunPriceSeq',
    module: 'idseq_dag.steps.run_priceseq',
    additional_files: {},
    additional_attributes: {},
  }
  steps << {
    in: ['priceseq_out'],
    out: 'cdhitdup_out',
    class: 'PipelineStepRunCDHitDup',
    module: 'idseq_dag.steps.run_cdhitdup',
    additional_files: {},
    additional_attributes: {},
  }
  steps << {
    in: ['cdhitdup_out'],
    out: 'lzw_out',
    class: 'PipelineStepRunLZW',
    module: 'idseq_dag.steps.run_lzw',
    additional_files: {},
    additional_attributes: {
      thresholds: [0.45, 0.42],
      threshold_readlength: 150,
    },
  }
  steps << {
    in: ['lzw_out'],
    out: 'bowtie2_out',
    class: 'PipelineStepRunBowtie2',
    module: 'idseq_dag.steps.run_bowtie2',
    additional_files: {
      bowtie2_genome: attr[:bowtie2_genome],
    },
    additional_attributes: { output_sam_file: 'bowtie2.sam' },
  }
  steps << {
    in: ['bowtie2_out'],
    out: 'subsampled_out',
    class: 'PipelineStepRunSubsample',
    module: 'idseq_dag.steps.run_subsample',
    additional_files: {},
    additional_attributes: { max_fragments: attr[:max_subsample_frag] },
  }

  if attr[:host_genome] != 'human'
    steps << {
      in: %w[subsampled_out validate_input_out],
      out: 'star_human_out',
      class: 'PipelineStepRunStarDownstream',
      module: 'idseq_dag.steps.run_star_downstream',
      additional_files: { star_genome: attr[:human_star_genome] },
      additional_attributes: {},
    }
    steps << {
      in: ['star_human_out'],
      out: 'bowtie2_human_out',
      class: 'PipelineStepRunBowtie2',
      module: 'idseq_dag.steps.run_bowtie2',
      additional_files: { bowtie2_genome: attr[:human_bowtie2_genome] },
      additional_attributes: { output_sam_file: 'bowtie2_human.sam' },
    }
  end

  steps << {
    in: [attr[:host_genome] != 'human' ? 'bowtie2_human_out' : 'subsampled_out'],
    out: 'gsnap_filter_out',
    class: 'PipelineStepRunGsnapFilter',
    module: 'idseq_dag.steps.run_gsnap_filter',
    additional_files: {
      gsnap_genome: 's3://idseq-database/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/hg38_pantro5_k16.tar',
    },
    additional_attributes: { output_sam_file: 'gsnap_filter.sam' },
  }

  json.array! steps
end

json.given_targets do
  json.fastqs do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/fastqs"
    json.count_reads 1
    json.max_fragments attr[:max_fragments]
  end
end
