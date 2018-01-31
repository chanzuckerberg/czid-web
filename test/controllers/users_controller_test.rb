require 'test_helper'

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:two)
    @host_genome = host_genomes(:one)
    @background = backgrounds(:one)
    post user_session_path, params: { 'user[email]' => @user.email, 'user[password]' => 'password2' }
  end

  test 'non admin shouldnt get index' do
    get users_url
    assert_redirected_to root_url
  end

  test 'non admin shouldnt get new' do
    get new_user_url
    assert_redirected_to root_url
  end

  test 'non admin shouldnt should get edit' do
    get edit_user_url(@user)
    assert_redirected_to root_url
  end

  test 'non admin shouldnt destroy user' do
    delete user_url(@user)
    assert_redirected_to root_url
  end

  test 'non admin shouldnt create user ' do
    post users_url, params: { user: { email: "test@gmail.com", password: "password3", password_confirmation: "password3" } }
    assert_redirected_to root_url
  end

  test 'non admin shouldnt update user' do
    put user_url @user, params: { user: { name: "abc xyz" } }
    assert_redirected_to root_url
  end

  # Host Genomes

  test 'host genome -non admin shouldnt get index' do
    get host_genomes_url
    assert_redirected_to root_url
  end

  test 'host genome -non admin shouldnt get new' do
    get new_host_genome_url
    assert_redirected_to root_url
  end

  test 'host genome -non admin shouldnt get show' do
    get host_genome_url(@host_genome)
    assert_redirected_to root_url
  end

  test 'host genome -non admin shouldnt should get edit' do
    get edit_host_genome_url(@host_genome)
    assert_redirected_to root_url
  end

  test 'host genome -non admin shouldnt update ' do
    put host_genome_url @host_genome, params: { host_genome: { name: "abc xyz" } }
    assert_redirected_to root_url
  end

  test 'host genome -non admin shouldnt destroy ' do
    delete host_genome_url(@host_genome)
    assert_redirected_to root_url
  end

  test 'host genome -non admin shouldnt create ' do
    post host_genomes_url, params: { host_genome: { name: "dsfsdfd" } }
    assert_redirected_to root_url
  end

  # Backgrounds

  test ' background -non admin shouldnt get index' do
    get backgrounds_url
    assert_redirected_to root_url
  end

  test ' background -non admin shouldnt get new' do
    get new_background_url
    assert_redirected_to root_url
  end

  test ' background -non admin shouldnt get show' do
    get background_url(@background)
    assert_redirected_to root_url
  end

  test ' background -non admin shouldnt should get edit' do
    get edit_background_url(@background)
    assert_redirected_to root_url
  end

  test ' background -non admin shouldnt update ' do
    put background_url @background, params: { background: { name: "abc xyz" } }
    assert_redirected_to root_url
  end

  test ' background -non admin shouldnt destroy ' do
    delete background_url(@background)
    assert_redirected_to root_url
  end

  test ' background -non admin shouldnt create ' do
    post backgrounds_url, params: { background: { name: "dsfsdfd" } }
    assert_redirected_to root_url
  end
end
