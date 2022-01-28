require 'rails_helper'

RSpec.describe Annotation, type: :model do
  context "fetch_annotations_by_tax_id" do
    before do
      @taxon1 = create(:taxon_lineage, tax_name: "taxon 1", taxid: 1)
      @taxon2 = create(:taxon_lineage, tax_name: "taxon 2", taxid: 2)
      @taxon3 = create(:taxon_lineage, tax_name: "taxon 2", taxid: 3)
      @pr = create(:pipeline_run,
                   sample: create(:sample, project: create(:project)))
      @annotation = create(:annotation, pipeline_run_id: @pr.id, tax_id: @taxon1.taxid, content: "inconclusive")
    end

    it "should return an empty hash if there are no applicable annotations" do
      tax_ids = []
      response = Annotation.fetch_annotations_by_tax_id(tax_ids, @pr.id)
      expect(response).to eq({})
    end

    it "should return annotations from the specified pipeline run" do
      annotation2 = create(:annotation, pipeline_run_id: @pr.id, tax_id: @taxon2.taxid, content: "inconclusive")

      pr2 = create(:pipeline_run,
                   sample: create(:sample, project: create(:project)))
      create(:annotation, pipeline_run_id: pr2.id, tax_id: @taxon3.taxid, content: "inconclusive")

      tax_ids = [@taxon1.taxid, @taxon2.taxid, @taxon3.taxid]
      expected_response = {
        @annotation.tax_id => @annotation.content,
        annotation2.tax_id => annotation2.content,
      }

      response = Annotation.fetch_annotations_by_tax_id(tax_ids, @pr.id)
      expect(response).to eq(expected_response)
    end

    it "should return annotations from the specified tax_ids" do
      create(:annotation, pipeline_run_id: @pr.id, tax_id: @taxon2.taxid, content: "inconclusive")

      tax_ids = [@taxon1.taxid]
      expected_response = {
        @annotation.tax_id => @annotation.content,
      }

      response = Annotation.fetch_annotations_by_tax_id(tax_ids, @pr.id)
      expect(response).to eq(expected_response)
    end

    it "should return each taxon's most recent annotation" do
      active_annotation = create(:annotation, pipeline_run_id: @pr.id, tax_id: @taxon1.taxid, content: "hit")

      tax_ids = [@taxon1.taxid]
      expected_response = {
        active_annotation.tax_id => active_annotation.content,
      }

      response = Annotation.fetch_annotations_by_tax_id(tax_ids, @pr.id)
      expect(response).to eq(expected_response)
    end
  end
end
