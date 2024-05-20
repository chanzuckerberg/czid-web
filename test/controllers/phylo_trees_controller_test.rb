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

  test 'should show phylo_tree' do
    pt = phylo_trees(:public_phylo_tree)
    get "/phylo_trees/#{pt.id}/show.json"
    assert_response :success
  end
end
