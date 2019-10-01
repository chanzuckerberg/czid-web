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
  json.assembly_out [
                      "assembly/contigs.fasta",
                      "assembly/scaffolds.fasta",
                      "assembly/read-contig.sam",
                      "assembly/contig_stats.json",
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


  
  json.contig_summary_out ["assembly/combined_contig_summary.json"]

  json.refined_annotated_out ["assembly/refined_annotated_merged.fa", "assembly/refined_unidentified.fa"]
  json.refined_taxid_fasta_out ["assembly/refined_taxid_annot.fasta"]
  json.refined_taxid_locator_out [
                                   "assembly/refined_taxid_annot_sorted_nt.fasta",
                                   "assembly/refined_taxid_locations_nt.json",
                                   "assembly/refined_taxid_annot_sorted_nr.fasta",
                                   "assembly/refined_taxid_locations_nr.json",
                                   "assembly/refined_taxid_annot_sorted_genus_nt.fasta",
                                   "assembly/refined_taxid_locations_genus_nt.json",
                                   "assembly/refined_taxid_annot_sorted_genus_nr.fasta",
                                   "assembly/refined_taxid_locations_genus_nr.json",
                                   "assembly/refined_taxid_annot_sorted_family_nt.fasta",
                                   "assembly/refined_taxid_locations_family_nt.json",
                                   "assembly/refined_taxid_annot_sorted_family_nr.fasta",
                                   "assembly/refined_taxid_locations_family_nr.json",
                                   "assembly/refined_taxid_locations_combined.json",
                                 ]
end

json.steps do
  steps = []

  steps << {
    in: ["host_filter_out"],
    out: "assembly_out",
    class: "PipelineStepRunAssembly",
    module: "idseq_dag.steps.run_assembly",
    additional_files: {},
    additional_attributes: {memory: 200},
  }

  steps << {
    in: ["assembly_out"],
    out: "coverage_out",
    class: "PipelineStepGenerateCoverageStats",
    module: "idseq_dag.steps.generate_coverage_stats",
    additional_files: {},
    additional_attributes: {},
  }

  steps << {
    in: ["gsnap_out"],
    out: "gsnap_accessions_out",
    class: "PipelineStepDownloadAccessions",
    module: "idseq_dag.steps.download_accessions",
    additional_files: {
      lineage_db: attr[:lineage_db],
      loc_db: attr[:nt_loc_db],
    },
    additional_attributes: {
      db: attr[:nt_db],
      db_type: "nt",
    },
  }

  steps << {
    in: ["rapsearch2_out"],
    out: "rapsearch2_accessions_out",
    class: "PipelineStepDownloadAccessions",
    module: "idseq_dag.steps.download_accessions",
    additional_files: {
      lineage_db: attr[:lineage_db],
      loc_db: attr[:nr_loc_db],
    },
    additional_attributes: {
      db: attr[:nr_db],
      db_type: "nr",
    },
  }

  additional_files = {
    lineage_db: attr[:lineage_db],
  }
  if attr[:skip_dedeuterostome_filter] == 0
    additional_files["deuterostome_db"] = attr[:deuterostome_db]
  end

  steps << {
    in: ["gsnap_out", "assembly_out", "gsnap_accessions_out"],
    out: "refined_gsnap_out",
    class: "PipelineStepBlastContigs",
    module: "idseq_dag.steps.blast_contigs",
    additional_files: additional_files,
    additional_attributes: {
      db_type: "nt",
    },
  }

  steps << {
    in: ["rapsearch2_out", "assembly_out", "rapsearch2_accessions_out"],
    out: "refined_rapsearch2_out",
    class: "PipelineStepBlastContigs",
    module: "idseq_dag.steps.blast_contigs",
    additional_files: additional_files,
    additional_attributes: {
      db_type: "nr",
    },
  }

  steps << {
    in: ["refined_gsnap_out", "refined_rapsearch2_out"],
    out: "refined_taxon_count_out",
    class: "PipelineStepCombineTaxonCounts",
    module: "idseq_dag.steps.combine_taxon_counts",
    additional_files: {},
    additional_attributes: {},
  }

  steps << {
    in: ["refined_gsnap_out", "refined_rapsearch2_out"],
    out: "contig_summary_out",
    class: "PipelineStepCombineJson",
    module: "idseq_dag.steps.combine_json",
    additional_files: {},
    additional_attributes: {field_idx: 4},
  }

  steps << {
    in: ["host_filter_out", "refined_gsnap_out", "refined_rapsearch2_out"],
    out: "refined_annotated_out",
    class: "PipelineStepGenerateAnnotatedFasta",
    module: "idseq_dag.steps.generate_annotated_fasta",
    additional_files: {},
    additional_attributes: {},
  }

  steps << {
    in: ["refined_annotated_out", "refined_gsnap_out", "refined_rapsearch2_out"],
    out: "refined_taxid_fasta_out",
    class: "PipelineStepGenerateTaxidFasta",
    module: "idseq_dag.steps.generate_taxid_fasta",
    additional_files: {
      lineage_db: attr[:lineage_db],
    },
    additional_attributes: {},
  }

  steps << {
    in: ["refined_taxid_fasta_out"],
    out: "refined_taxid_locator_out",
    class: "PipelineStepGenerateTaxidLocator",
    module: "idseq_dag.steps.generate_taxid_locator",
    additional_files: {},
    additional_attributes: {},
  }

  json.array! steps
end

json.given_targets do
  json.host_filter_out do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end

  json.gsnap_out do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end

  json.rapsearch2_out do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end
end
