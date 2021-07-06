require "rails_helper"

RSpec.describe DagGenerator do
  let(:template_file) { "phylo_trees/phylo_tree" }
  let(:attribute_dict) do
    {
      phylo_tree_output_s3_path: "fake-path",
      newick_basename: "fake-newick-basename",
      ncbi_metadata_basename: "fake-ncbi-basename",
      taxid: 1,
      reference_taxids: [1],
      superkingdom_name: "Eukaryota",
      taxon_byteranges: {},
      hitsummary2_files: {},
      nt_db: "nt_db_file",
      nt_loc_db: "nt_loc_db_file",
      sample_names_by_run_ids: {},
    }
  end

  subject do
    DagGenerator.new(template_file, 1, nil, nil, attribute_dict, {})
  end

  describe "#render" do
    it "processes a jbuilder template and replaces interpolated attributes" do
      expect(subject.render).to include(
        attribute_dict[:superkingdom_name],
        attribute_dict[:newick_basename],
        attribute_dict[:ncbi_metadata_basename]
      )
    end
  end
end
