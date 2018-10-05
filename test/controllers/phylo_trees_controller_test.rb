require 'test_helper'

class PhyloTreesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    post user_session_path, params: { 'user[email]' => @user.email, 'user[password]' => 'password' }
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
    entrypoint_taxon_count = taxon_counts(:three)
    assert_difference('PhyloTree.count') do
      post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: @project.id,
                                            taxId: entrypoint_taxon_count.tax_id, pipelineRunIds: [pipeline_runs(:three).id, pipeline_runs(:four).id],
                                            taxName: entrypoint_taxon_count.name }
    end
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'should show phylo_tree' do
    pt = phylo_trees(:one)
    get "/phylo_trees/index.json?taxId=#{pt.taxid}&projectId=#{pt.project_id}"
    is_tree_in_response = JSON.parse(@response.body)['phyloTrees'].select { |tree| tree['id'] == pt.id }.count == 1
    assert_equal is_tree_in_response, true
  end
end
