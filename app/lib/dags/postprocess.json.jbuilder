json.name attr[:dag_name]

json.output_dir_s3 "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/postprocess"

json.targets do
  host_filter_out = ["gsnap_filter_1.fa"]
  if attr[:input_file_count] > 1
    host_filter_out += ["gsnap_filter_2.fa", "gsnap_filter_merged.fa"]
  end
  json.host_filter_out host_filter_out

  json.gsnap_out [
                   "gsnap.m8",
                   "gsnap.deduped.m8",
                   "gsnap.hitsummary.tab",
                   "gsnap_counts.json",
                 ]
  json.rapsearch2_out [
                        "rapsearch2.m8",
                        "rapsearch2.deduped.m8",
                        "rapsearch2.hitsummary.tab",
                        "rapsearch2_counts.json",
                      ]
  json.assembly_out [
                      "assembly/contigs.fasta",
                      "assembly/scaffolds.fasta",
                      "assembly/read-contig.sam",
                      "assembly/contig_stats.json",
                    ]
  json.coverage_out [
                      "assembly/contig_coverage.json",
                      "assembly/contig_coverage_summary.csv",
                    ]
  json.gsnap_accessions_out ["assembly/nt.refseq.fasta"]
  json.rapsearch2_accessions_out ["assembly/nr.refseq.fasta"]
  json.refined_gsnap_out [
    "assembly/gsnap.blast.m8",
    "assembly/gsnap.reassigned.m8",
    "assembly/gsnap.hitsummary2.tab",
    "assembly/refined_gsnap_counts.json",
    "assembly/gsnap_contig_summary.json",
    "assembly/gsnap.blast.top.m8",
  ]
  json.refined_rapsearch2_out [
    "assembly/rapsearch2.blast.m8",
    "assembly/rapsearch2.reassigned.m8",
    "assembly/rapsearch2.hitsummary2.tab",
    "assembly/refined_rapsearch2_counts.json",
    "assembly/rapsearch2_contig_summary.json",
    "assembly/rapsearch2.blast.top.m8",
  ]
  json.refined_taxon_count_out ["assembly/refined_taxon_counts.json"]
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

  json.array! steps
end

json.given_targets do
  json.host_filter_out do
    json.s3_dir "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results/#{attr[:pipeline_version]}"
  end
end
