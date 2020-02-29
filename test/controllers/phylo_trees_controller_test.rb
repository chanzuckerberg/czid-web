require 'test_helper'

class PhyloTreesControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in :admin_one
    @project = projects(:one)
  end

  test 'should get index' do
    get "/phylo_trees/index"
    assert_response :success
  end

  test 'should get new' do
    taxid = 1
    get "/phylo_trees/new.json?taxId=#{taxid}&projectId=#{@project.id}"
    assert_response :success
  end

  test 'should create phylo_tree' do
    entrypoint_taxon_count = taxon_counts(:five) # Klebsiella pneumoniae
    assert_difference('PhyloTree.count') do
      params = {
        name: 'new_phylo_tree',
        projectId: @project.id,
        taxId: entrypoint_taxon_count.tax_id,
        pipelineRunIds: [
          pipeline_runs(:three).id,
          pipeline_runs(:four).id,
        ],
        taxName: entrypoint_taxon_count.name,
      }
      post "/phylo_trees/create", params: params
    end
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'should show phylo_tree' do
    pt = phylo_trees(:public_phylo_tree)
    get "/phylo_trees/#{pt.id}/show.json"
    assert_response :success
  end
end
