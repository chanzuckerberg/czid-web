require 'test_helper'

class HomeControllerTest < ActionDispatch::IntegrationTest
  test 'joe redirect to my_data when seeing joe_project with data_discovery' do
    sign_in(:joe_dd)
    @joe_project = projects(:joe_project)
    get "/home?project_id=#{@joe_project.id}"
    res = @response.body

    assert_redirect_to(action: my_data, )
    assert_response :success
    puts res
  end

  test 'joe redirect to my_data when seeing joe_project with data_discovery' do
    sign_in(:joe_dd)
    @joe_project = projects(:joe_project)
    get "/home?project_id=#{@joe_project.id}"
    res = @response.body

    assert_redirect_to(action: my_data, )
    assert_response :success
    puts res
  end

  test 'joe redirect to my_data when seeing joe_project with data_discovery' do
    sign_in(:joe_dd)
    @joe_project = projects(:joe_project)
    get "/home?project_id=#{@joe_project.id}"
    res = @response.body

    assert_redirect_to(action: my_data, )
    assert_response :success
    puts res
  end

  
end
