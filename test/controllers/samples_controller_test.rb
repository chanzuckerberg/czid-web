require 'test_helper'

class SamplesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @background = backgrounds(:real_background)
    @sample = samples(:one)
    @deletable_sample = samples(:deletable_sample)
    @project = projects(:one)
    @user = users(:one)
    @user.authentication_token = 'sdfsdfsdff'
    @user.save
    @user_params = { 'user[email]' => @user.email, 'user[password]' => 'password' }
  end

  test 'should get index' do
    post user_session_path, params: @user_params
    get samples_url
    assert_response :success
  end

  test 'should get new' do
    post user_session_path, params: @user_params
    get new_sample_url
    assert_response :success
  end

  test 'should create sample' do
    req_headers = { 'X-User-Email' => @user.email,
                    'X-User-Token' => @user.authentication_token }
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, input_files_attributes: input_files } }, headers: req_headers
    end
    assert_redirected_to sample_url(Sample.last)
  end

  test 'should redirect ' do
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_difference('Sample.count', 0) do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, input_files_attributes: input_files } }
    end
    assert_redirected_to new_user_session_url
  end

  test 'pipeline_runs' do
    get pipeline_runs_sample_url(@sample)
    assert :success
  end

  test 'reupload source' do
    post user_session_path, params: @user_params
    put reupload_source_sample_url(@sample)
    assert :success
  end

  test 'reupload source 2' do
    put reupload_source_sample_url(@sample)
    assert_redirected_to new_user_session_url
  end

  test 'kick off pipeline' do
    post user_session_path, params: @user_params
    put kickoff_pipeline_sample_url(@sample)
    assert :success
  end

  test 'kick off pipeline redirect' do
    put kickoff_pipeline_sample_url(@sample)
    assert_redirected_to new_user_session_url
  end

  test 'should create sample through web' do
    post user_session_path, params: @user_params
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, input_files_attributes: input_files } }
    end
    assert_redirected_to sample_url(Sample.last)
  end

  test 'should show sample' do
    post user_session_path, params: @user_params
    get sample_url(@sample)
    assert_response :success
  end

  test 'should get correct report' do
    post user_session_path, params: @user_params
    get "/samples/#{samples(:six).id}/report_info?background_id=#{@background.id}"
    json_response = JSON.parse(response.body)

    # Examples pulled from sample 1299 on prod
    # Test species taxid 573, which has genus taxid 570
    species_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 573 }[0]
    genus_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 570 }[0]

    assert_equal 209.0, species_result["NT"]["r"]
    assert_equal "186274.5", species_result["NT"]["rpm"]
    assert_equal 99.0, species_result["NT"]["zscore"]
    assert_equal 2_428_411_411.8, species_result["NT"]["aggregatescore"]
    assert_equal 89.6, species_result["NT"]["neglogevalue"]
    assert_equal 69.0, species_result["NR"]["r"]
    assert_equal "61497.3", species_result["NR"]["rpm"]
    assert_equal 99.0, species_result["NR"]["zscore"]
    assert_equal 2_428_411_411.8, species_result["NR"]["aggregatescore"]
    assert_equal 16.9, species_result["NR"]["neglogevalue"]

    assert_equal 217.0, genus_result["NT"]["r"]
    assert_equal "193404.6", genus_result["NT"]["rpm"]
    assert_equal 99.0, genus_result["NT"]["zscore"]
    assert_equal 2_428_411_411.8, genus_result["NT"]["aggregatescore"]
    assert_equal 89.6, genus_result["NT"]["neglogevalue"]
    assert_equal 87.0, genus_result["NR"]["r"]
    assert_equal "77540.1", genus_result["NR"]["rpm"]
    assert_equal 99.0, genus_result["NR"]["zscore"]
    assert_equal 2_428_411_411.8, genus_result["NR"]["aggregatescore"]
    assert_equal 17.0, genus_result["NR"]["neglogevalue"]

    # Test species taxid 1313, which has genus taxid 1301
    species_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 1313 }[0]
    genus_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 1301 }[0]

    assert_equal 0, species_result["NT"]["r"]
    assert_equal 0, species_result["NT"]["rpm"]
    assert_equal(-100, species_result["NT"]["zscore"])
    assert_equal 12_727.05, species_result["NT"]["aggregatescore"]
    assert_equal 0.0, species_result["NT"]["neglogevalue"]
    assert_equal 2.0, species_result["NR"]["r"]
    assert_equal "1782.5", species_result["NR"]["rpm"]
    assert_equal 4.2, species_result["NR"]["zscore"]
    assert_equal 12_727.05, species_result["NR"]["aggregatescore"]
    assert_equal 9.3, species_result["NR"]["neglogevalue"]

    assert_equal 4.0, genus_result["NT"]["r"]
    assert_equal "3565.1", genus_result["NT"]["rpm"]
    assert_equal 2.2, genus_result["NT"]["zscore"]
    assert_equal 72_941.946, genus_result["NT"]["aggregatescore"]
    assert_equal 81.5, genus_result["NT"]["neglogevalue"]
    assert_equal 2.0, genus_result["NR"]["r"]
    assert_equal "1782.5", genus_result["NR"]["rpm"]
    assert_equal 1.7, genus_result["NR"]["zscore"]
    assert_equal 72_941.946, genus_result["NR"]["aggregatescore"]
    assert_equal 9.3, genus_result["NR"]["neglogevalue"]
  end

  test 'should get edit' do
    post user_session_path, params: @user_params
    get edit_sample_url(@sample)
    assert_response :success
  end

  test 'should update sample' do
    post user_session_path, params: @user_params
    assert @sample.valid?
    patch sample_url(@sample), params: { sample: { name: @sample.name + ' asdf' } }
    assert_redirected_to sample_url(@sample)
  end

  test 'should destroy sample' do
    post user_session_path, params: @user_params
    assert_difference('Sample.count', -1) do
      delete sample_url(@deletable_sample)
    end
    assert_redirected_to samples_url
  end
end
