json.name attr[:dag_name]

json.output_dir_s3 "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results"

json.targets do
  host_filter_out = ["gsnap_filter_1.fa"]
  if attr[:input_file_count] > 1
    host_filter_out += ["gsnap_filter_2.fa", "gsnap_filter_merged.fa"]
  end
  json.host_filter_out host_filter_out

  json.gsnap_out [
    attr[:gsnap_m8],
    "gsnap.deduped.m8",
    "gsnap.hitsummary.tab",
    "gsnap_counts_with_dcr.json",
  ]
  json.rapsearch2_out [
    attr[:rapsearch_m8],
    "rapsearch2.deduped.m8",
    "rapsearch2.hitsummary.tab",
    "rapsearch2_counts_with_dcr.json",
  ]
  json.taxon_count_out ["taxon_counts_with_dcr.json"]
  json.annotated_out ["annotated_merged.fa", "unidentified.fa"]

  json.cdhitdup_cluster_sizes [
    "cdhitdup_cluster_sizes.tsv",
  ]
end

json.steps do
  steps = []

  additional_files = {
    lineage_db: attr[:lineage_db],
    accession2taxid_db: attr[:accession2taxid_db],
  }

  if attr[:skip_dedeuterostome_filter] == 0
    additional_files["deuterostome_db"] = attr[:deuterostome_db]
  end

  additional_attributes = {
    service: "gsnap",
    chunk_size: attr[:gsnap_chunk_size],
    environment: attr[:rails_env] == "prod" ? "prod" : "staging",
  }

  if attr[:index_dir_suffix]
    additional_attributes["index_dir_suffix"] = attr[:index_dir_suffix]
  end

  if attr[:use_taxon_whitelist]
    additional_attributes["use_taxon_whitelist"] = attr[:use_taxon_whitelist]
  end

  steps << {
    in: ["host_filter_out", "cdhitdup_cluster_sizes"],
    out: "gsnap_out",
    class: "PipelineStepRunAlignmentRemotely",
    module: "idseq_dag.steps.run_alignment_remotely",
    additional_files: additional_files,
    additional_attributes: additional_attributes,
  }

  additional_attributes = {
    service: "rapsearch2",
    chunk_size: attr[:rapsearch_chunk_size],
    environment: attr[:rails_env] == "prod" ? "prod" : "staging",
  }

  if attr[:index_dir_suffix]
    additional_attributes["index_dir_suffix"] = attr[:index_dir_suffix]
  end

  if attr[:use_taxon_whitelist]
    additional_attributes["use_taxon_whitelist"] = attr[:use_taxon_whitelist]
  end

  steps << {
    in: ["host_filter_out", "cdhitdup_cluster_sizes"],
    out: "rapsearch2_out",
    class: "PipelineStepRunAlignmentRemotely",
    module: "idseq_dag.steps.run_alignment_remotely",
    additional_files: additional_files,
    additional_attributes: additional_attributes,
  }

  steps << {
    in: ["gsnap_out", "rapsearch2_out"],
    out: "taxon_count_out",
    class: "PipelineStepCombineTaxonCounts",
    module: "idseq_dag.steps.combine_taxon_counts",
    additional_files: {},
    additional_attributes: {},
  }

  steps << {
    in: ["host_filter_out", "gsnap_out", "rapsearch2_out", "cdhitdup_cluster_sizes"],
    out: "annotated_out",
    class: "PipelineStepGenerateAnnotatedFasta",
    module: "idseq_dag.steps.generate_annotated_fasta",
    additional_files: {},
    additional_attributes: {},
  }

  json.array! steps
end

json.given_targets do
  json.host_filter_out do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end

  json.cdhitdup_cluster_sizes do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end
end
