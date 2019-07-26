module DagJsonHelper
  DAG_NAME_HOST_FILTER = "host_filter".freeze
  DAG_NAME_ALIGNMENT = "non_host_alignment".freeze
  DAG_NAME_POST_PROCESS = "postprocess".freeze
  DAG_NAME_EXPERIMENTAL = "experimental".freeze

  def generate_host_filtering_dag_json(pipeline_run)
    sample = pipeline_run.sample
    file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      file_ext: file_ext,
      star_genome: sample.s3_star_index_path,
      bowtie2_genome: sample.s3_bowtie2_index_path,
      max_fragments: pipeline_run.max_input_fragments,
      max_subsample_frag: pipeline_run.subsample
    }
    human_host_genome = HostGenome.find_by(name: "Human")
    attribute_dict[:human_star_genome] = human_host_genome.s3_star_index_path
    attribute_dict[:human_bowtie2_genome] = human_host_genome.s3_bowtie2_index_path
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    attribute_dict[:adapter_fasta] = if sample.input_files[1]
                                       PipelineRun::ADAPTER_SEQUENCES["paired-end"]
                                     else
                                       PipelineRun::ADAPTER_SEQUENCES["single-end"]
                                     end
    attribute_dict[:bucket] = SAMPLES_BUCKET_NAME
    _render_dag_json(sample, attribute_dict)
  end

  def generate_alignment_dag_json(pipeline_run)
    sample = pipeline_run.sample
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      input_file_count: sample.input_files.count,
      skip_dedeuterostome_filter: sample.skip_deutero_filter_flag,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_version,
      index_dir_suffix: alignment_config.index_dir_suffix,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      nr_db: alignment_config.s3_nr_db_path,
      nr_loc_db: alignment_config.s3_nr_loc_db_path,
      max_interval_between_describe_instances: PipelineRun::MAX_JOB_DISPATCH_LAG_SECONDS,
      job_tag_prefix: PipelineRun::JOB_TAG_PREFIX,
      job_tag_refresh_seconds: PipelineRun::JOB_TAG_KEEP_ALIVE_SECONDS,
      draining_tag: PipelineRun::DRAINING_TAG,
      gsnap_chunk_size: PipelineRun::GSNAP_CHUNK_SIZE,
      rapsearch_chunk_size: PipelineRun::RAPSEARCH_CHUNK_SIZE,
      gsnap_max_concurrent: PipelineRun::GSNAP_MAX_CONCURRENT,
      rapsearch_max_concurrent: PipelineRun::RAPSEARCH_MAX_CONCURRENT,
      chunks_in_flight: PipelineRun::MAX_CHUNKS_IN_FLIGHT,
      gsnap_m8: PipelineRun::GSNAP_M8,
      rapsearch_m8: PipelineRun::RAPSEARCH_M8
    }
    attribute_dict[:bucket] = SAMPLES_BUCKET_NAME
    _render_dag_json(sample, attribute_dict)
  end

  def generate_postprocess_dag_json(pipeline_run)
    sample = pipeline_run.sample
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      input_file_count: sample.input_files.count,
      skip_dedeuterostome_filter: sample.skip_deutero_filter_flag,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_version,
      index_dir_suffix: alignment_config.index_dir_suffix,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      nr_db: alignment_config.s3_nr_db_path,
      nr_loc_db: alignment_config.s3_nr_loc_db_path
    }
    attribute_dict[:bucket] = SAMPLES_BUCKET_NAME
    _render_dag_json(sample, attribute_dict)
  end

  def generate_experimental_dag_json(pipeline_run)
    sample = pipeline_run.sample
    file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
    alignment_config = pipeline_run.alignment_config
    attribute_dict = {
      fastq1: sample.input_files[0].name,
      file_ext: file_ext,
      pipeline_version: pipeline_run.pipeline_version || pipeline_run.fetch_pipeline_version,
      lineage_db: alignment_config.s3_lineage_path,
      accession2taxid_db: alignment_config.s3_accession2taxid_path,
      deuterostome_db: alignment_config.s3_deuterostome_db_path,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      nr_db: alignment_config.s3_nr_db_path,
      nr_loc_db: alignment_config.s3_nr_loc_db_path
    }
    attribute_dict[:fastq2] = sample.input_files[1].name if sample.input_files[1]
    attribute_dict[:bucket] = SAMPLES_BUCKET_NAME
    _render_dag_json(sample, attribute_dict)
  end

  private

  def _render_dag_json(sample, attribute_dict)
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           sample.project_id,
                           sample.id,
                           sample.host_genome_name.downcase,
                           attribute_dict,
                           pipeline_run.parse_dag_vars)
    dag.render
  end
end
