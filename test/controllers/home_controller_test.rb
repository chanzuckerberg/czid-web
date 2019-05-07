require 'test_helper'

class HomeControllerTest < ActionDispatch::IntegrationTest
  test 'joe redirected to project page in my_data when linking to joe_project with data_discovery' do
    sign_in(:joe_dd)
    @joe_project = projects(:joe_project)
    get "/home?project_id=#{@joe_project.id}"

    assert_response :redirect
    assert_redirected_to action: "my_data", controller: "home", project_id: @joe_project.id
  end

  test 'joe redirected to project page in public when linking to public_project with data_discovery' do
    sign_in(:joe_dd)
    @public_project = projects(:public_project)
    get "/home?project_id=#{@public_project.id}"

    assert_response :redirect
    assert_redirected_to action: "public", controller: "home", project_id: @public_project.id
  end

  test 'joe redirected to default my_data when linking to some other project with data_discovery' do
    sign_in(:joe_dd)
    @not_joe_project = projects(:not_joe_project)
    get "/home?project_id=#{@not_joe_project.id}"

    assert_response :redirect
    assert_redirected_to action: "my_data", controller: "home"
  end

  # test admin can see

  test 'admin redirected to project page in my_data when linking to its admin_project with data_discovery' do
    sign_in(:admin)
    @admin_project = projects(:admin_project)
    get "/home?project_id=#{@admin_project.id}"

    assert_response :redirect
    assert_redirected_to action: "my_data", controller: "home", project_id: @admin_project.id
  end

  test 'admin redirected to project page in public when linking to public_project with data_discovery' do
    sign_in(:admin)
    @public_project = projects(:public_project)
    get "/home?project_id=#{@public_project.id}"

    assert_response :redirect
    assert_redirected_to action: "public", controller: "home", project_id: @public_project.id
  end

  test 'admin redirected to project page in all_data when linking to other project with data_discovery' do
    sign_in(:admin)
    @not_joe_project = projects(:not_joe_project)
    get "/home?project_id=#{@not_joe_project.id}"

    assert_response :redirect
    assert_redirected_to action: "all_data", controller: "home", project_id: @not_joe_project.id
  end

  test 'non-dd user sees legacy home page' do
    sign_in(:joe)
    @joe_project = projects(:joe_project)
    get "/home?project_id=#{@joe_project.id}"

    assert_response :success
    assert_template :legacy
  end

  test 'joe redirected to my data path when accessing home path with data discovery' do
    sign_in(:joe_dd)
    get "/home"

    assert_response :redirect
    assert_redirected_to action: "my_data", controller: "home"
  end

  test 'joe redirected to home path when accessing root path with data discovery' do
    sign_in(:joe_dd)
    get "/"

    assert_response :redirect
    assert_redirected_to home_path
  end
end
