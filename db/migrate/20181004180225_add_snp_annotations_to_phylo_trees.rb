require 'open3'

class AddSnpAnnotationsToPhyloTrees < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :snp_annotations, :string

    PhyloTree.all.each do |pt|
      s3_path = pt.s3_outputs["snp_annotations"]["s3_path"]
      if Open3.capture3("aws", "s3", "ls", s3_path)[2].success?
        pt.update(snp_annotations: s3_path)
      end
    end
  end
end
