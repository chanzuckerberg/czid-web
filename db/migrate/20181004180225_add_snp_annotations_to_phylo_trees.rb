require 'open3'

class AddSnpAnnotationsToPhyloTrees < ActiveRecord::Migration[5.1]
  include PipelineRunsHelper

  def change
    add_column :phylo_trees, :snp_annotations, :string

    PhyloTree.all.each do |pt|
      s3_path = pt.s3_outputs["snp_annotations"]["s3_path"]
      if exists_in_s3?(s3_path)
        pt.update(snp_annotations: s3_path)
      end
    end
  end
end
