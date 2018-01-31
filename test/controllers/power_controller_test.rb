require 'test_helper'

class PowerControllerTest < ActionDispatch::IntegrationTest
  setup do
    @joe = users(:joe)
    post user_session_path, params: { 'user[email]' => @joe.email, 'user[password]' => 'passwordjoe' }
  end

  test 'joe can create project' do
  end

  test 'joe can add users to joe_project ' do
  end

  test 'joe can create sample to joe_project' do
  end

  test 'joe can update sample to joe_project' do
  end

  test 'joe can see samples  in joe_project' do
  end

  test 'joe can see joe_sample' do
  end

  # public projects

  test 'joe cannot add users to public_project ' do
  end

  test 'joe cannot create sample to public_project' do
  end

  test 'joe cannot update sample to public_project' do
  end

  test 'joe can see samples in public_project' do
  end

  test 'joe can see public_sample' do
  end

  # private project

  test 'joe cannot add users to project one ' do
  end

  test 'joe cannot create sample to project one' do
  end

  test 'joe cannot update sample to project one' do
  end

  test 'joe cannot see samples in project one' do
  end

  test 'joe cannot see sample one' do
  end

  # visible samples in private project

  test 'joe cannot add users to project two ' do
  end

  test 'joe cannot create sample to project two' do
  end

  test 'joe cannot update expired_sample' do
  end

  test 'joe can see expired samples in project two' do
  end

  test 'joe cannot see expired_sample' do
  end

end
