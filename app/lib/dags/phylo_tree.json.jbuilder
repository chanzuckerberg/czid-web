json.name "phylo_tree"
json.output_dir_s3 attr[:phylo_tree_output_s3_path]

targets = {}
attr[:taxon_byteranges].keys.each do |pipeline_run_id|
  # Only allow valid numbers in interpolated keys
  raise AssertionError unless pipeline_run_id.is_a?(Numeric)

  targets["prepare_taxon_fasta_#{pipeline_run_id}_out"] = ["#{pipeline_run_id}.fasta"]
end
targets["phylo_tree_out"] = [attr[:newick_basename], attr[:ncbi_metadata_basename]]
json.targets targets

json.steps do
  steps = []

  attr[:taxon_byteranges].each do |pipeline_run_id, taxon_byteranges|
    steps << {
      in: [],
      out: "prepare_taxon_fasta_#{pipeline_run_id}_out",
      class: "PipelineStepPrepareTaxonFasta",
      module: "idseq_dag.steps.prepare_taxon_fasta",
      additional_files: {},
      additional_attributes: {
        superkingdom_name: attr[:superkingdom_name],
        taxon_byteranges: taxon_byteranges,
      },
    }
  end

  steps << {
    in: attr[:taxon_byteranges].keys.map do |pipeline_run_id|
      "prepare_taxon_fasta_#{pipeline_run_id}_out"
    end,
    out: "phylo_tree_out",
    class: "PipelineStepGeneratePhyloTree",
    module: "idseq_dag.steps.generate_phylo_tree",
    additional_files: {
      nt_loc_db: attr[:nt_loc_db],
    },
    additional_attributes: {
      taxid: attr[:taxid],
      reference_taxids: attr[:reference_taxids],
      superkingdom_name: attr[:superkingdom_name],
      nt_db: attr[:nt_db],
      hitsummary2_files: attr[:hitsummary2_files],
      sample_names_by_run_ids: attr[:sample_names_by_run_ids],
    },
  }

  json.array! steps
end

# Explicit parens for empty hash (instead of empty block)
# rubocop:disable Lint/ParenthesesAsGroupedExpression
json.given_targets ({})
# rubocop:enable Lint/ParenthesesAsGroupedExpression
