require 'test_helper'

class TaxonomiesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @taxonomy = taxonomies(:one)
  end

  test "should get index" do
    get taxonomies_url
    assert_response :success
  end

  test "should get new" do
    get new_taxonomy_url
    assert_response :success
  end

  test "should create taxonomy" do
    assert_difference('Taxonomy.count') do
      post taxonomies_url, params: { taxonomy: { version: @taxonomy.version } }
    end

    assert_redirected_to taxonomy_url(Taxonomy.last)
  end

  test "should show taxonomy" do
    get taxonomy_url(@taxonomy)
    assert_response :success
  end

  test "should get edit" do
    get edit_taxonomy_url(@taxonomy)
    assert_response :success
  end

  test "should update taxonomy" do
    patch taxonomy_url(@taxonomy), params: { taxonomy: { version: @taxonomy.version } }
    assert_redirected_to taxonomy_url(@taxonomy)
  end

  test "should destroy taxonomy" do
    assert_difference('Taxonomy.count', -1) do
      delete taxonomy_url(@taxonomy)
    end

    assert_redirected_to taxonomies_url
  end
end
