json.name attr[:dag_name]

json.output_dir_s3 "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/postprocess"

json.targets do
  json.taxid_fasta_in [
    "annotated_merged.fa",
    "gsnap.hitsummary.tab",
    "rapsearch2.hitsummary.tab",
  ]

  json.refined_gsnap_in [
    "gsnap.reassigned.m8",
    "gsnap.hitsummary2.tab",
    "gsnap.blast.top.m8",
  ]
  json.contig_in [
    "contig_coverage.json",
    "contig_stats.json",
    "contigs.fasta",
  ]
  json.gsnap_m8 ["gsnap.deduped.m8"]
  json.taxid_fasta_out ["taxid_annot.fasta"]
  json.taxid_locator_out [
    "taxid_annot_sorted_nt.fasta",
    "taxid_locations_nt.json",
    "taxid_annot_sorted_nr.fasta",
    "taxid_locations_nr.json",
    "taxid_annot_sorted_genus_nt.fasta",
    "taxid_locations_genus_nt.json",
    "taxid_annot_sorted_genus_nr.fasta",
    "taxid_locations_genus_nr.json",
    "taxid_annot_sorted_family_nt.fasta",
    "taxid_locations_family_nt.json",
    "taxid_annot_sorted_family_nr.fasta",
    "taxid_locations_family_nr.json",
    "taxid_locations_combined.json",
  ]
  json.alignment_viz_out ["align_viz.summary"]
  json.srst2_out ["out.log", "out__genes__ARGannot_r2__results.txt", "out__fullgenes__ARGannot_r2__results.txt", "amr_processed_results.csv", "amr_summary_results.csv", "output__.ARGannot_r2.sorted.bam"]
  json.coverage_viz_out ["coverage_viz_summary.json"]

  json.fastqs [attr[:fastq1], attr[:fastq2]].compact
  json.nonhost_fasta ["refined_taxid_annot.fasta"]

  if attr[:file_ext] == "fastq"
    if attr[:fastq2]
      json.nonhost_fastq_out ["nonhost_R1.fastq", "nonhost_R2.fastq"]
    else
      json.nonhost_fastq_out ["nonhost_R1.fastq"]
    end
  else
    # rubocop:disable IfInsideElse
    if attr[:fastq2]
      json.nonhost_fastq_out ["nonhost_R1.fasta", "nonhost_R2.fasta"]
    else
      json.nonhost_fastq_out ["nonhost_R1.fasta"]
    end
  end

  json.cdhitdup_clusters [
    "dedup1.fa.clstr",
  ]
  json.deduped_fasta [
    "dedup1.fa",
  ]
end

json.steps do
  steps = []

  steps << {
    in: ["taxid_fasta_in"],
    out: "taxid_fasta_out",
    class: "PipelineStepGenerateTaxidFasta",
    module: "idseq_dag.steps.generate_taxid_fasta",
    additional_files: {
      lineage_db: attr[:lineage_db],
    },
    additional_attributes: {},
  }

  steps << {
    in: ["taxid_fasta_out"],
    out: "taxid_locator_out",
    class: "PipelineStepGenerateTaxidLocator",
    module: "idseq_dag.steps.generate_taxid_locator",
    additional_files: {},
    additional_attributes: {},
  }

  steps << {
    in: [
      "gsnap_m8",
      "taxid_locator_out",
    ],
    out: "alignment_viz_out",
    class: "PipelineStepGenerateAlignmentViz",
    module: "idseq_dag.steps.generate_alignment_viz",
    additional_files: {
      nt_loc_db: attr[:nt_loc_db],
      nt_db: attr[:nt_db],
    },
    additional_attributes: {
      nt_db: attr[:nt_db],
    },
  }

  steps << {
    in: ["fastqs"],
    out: "srst2_out",
    class: "PipelineStepRunSRST2",
    module: "idseq_dag.steps.run_srst2",
    additional_files: {
      resist_gene_db: "s3://idseq-database/amr/ARGannot_r2.fasta",
      resist_genome_bed: "s3://idseq-database/amr/argannot_genome.bed",
    },
    additional_attributes: {
      min_cov: 0,
      n_threads: 16,
      file_ext: attr[:file_ext],
    },
  }

  steps << {
    in: ["refined_gsnap_in", "contig_in", "gsnap_m8"],
    out: "coverage_viz_out",
    class: "PipelineStepGenerateCoverageViz",
    module: "idseq_dag.steps.generate_coverage_viz",
    additional_files: {
      info_db: attr[:nt_info_db],
    },
    additional_attributes: {},
  }

  steps << {
    in: ["fastqs", "nonhost_fasta", "cdhitdup_clusters", "deduped_fasta"],
    out: "nonhost_fastq_out",
    class: "PipelineStepNonhostFastq",
    module: "idseq_dag.steps.nonhost_fastq",
    additional_files: {},
    additional_attributes: {
      use_taxon_whitelist: attr[:use_taxon_whitelist],
    },
  }

  json.array! steps
end

json.given_targets do
  json.taxid_fasta_in do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end

  json.gsnap_m8 do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end

  json.refined_gsnap_in do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/postprocess/#{attr[:pipeline_version]}/assembly"
  end

  json.contig_in do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/postprocess/#{attr[:pipeline_version]}/assembly"
  end

  json.fastqs do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/fastqs"
  end

  json.nonhost_fasta do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/postprocess/#{attr[:pipeline_version]}/assembly"
  end

  json.cdhitdup_clusters do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end

  json.deduped_fasta do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end
end
