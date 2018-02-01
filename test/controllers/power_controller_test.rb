require 'test_helper'

class PowerControllerTest < ActionDispatch::IntegrationTest
  setup do
    @joe = users(:joe)
    post user_session_path, params: { 'user[email]' => @joe.email, 'user[password]' => 'passwordjoe' }
  end

  test 'joe can create project' do
    post "#{projects_url}.json", params: { project: { name: "2nd Joe Project" } }
    assert_response :success
  end

  test 'joe can add users to joe_project ' do
    @joe_project = projects(:joe_project)
    put add_user_project_url(@joe_project), params: { user_email_to_add: "abc@xyz.com"  }
    assert_response :success
  end

  test 'joe can change project visibility to joe_project ' do
    @joe_project = projects(:joe_project)
    put update_project_visibility_project_url(@joe_project), params: { public_access: 0  }
    assert_response :success
  end

  test 'joe can create sample to joe_project' do
    @joe_project = projects(:joe_project)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @joe_project.name, input_files_attributes: input_files } }
    end
    assert_response :success
  end

  test 'joe can update sample to joe_project' do
    @joe_sample = samples(:joe_sample)
    post "#{save_metadata_sample_url(@joe_sample)}.json", params: {field: 'sample_tissue', value: 'bone'}
    assert_response :success
    @joe_sample.reload
    assert @joe_sample.sample_tissue == 'bone'
  end

  test 'joe can see samples  in joe_project' do
    @joe_project = projects(:joe_project)
    get "/samples.json?project_id=#{@joe_project.id}"
    assert_response :success
    assert JSON::parse(@response.body)["total_count"] == 1
  end

  test 'joe can see joe_sample' do
    @joe_sample = samples(:joe_sample)
    get sample_url(@joe_sample)
    assert_response :success
  end

  # public projects

  test 'joe cannot add users to public_project ' do
    @public_project = projects(:public_project)
    assert_raises(ActiveRecord::RecordNotFound) do
      put add_user_project_url(@public_project), params: { user_email_to_add: "abc@xyz.com"  }
    end
  end

  test 'joe cannot change project visibility to public_project ' do
    @public_project = projects(:public_project)
    assert_raises(ActiveRecord::RecordNotFound) do
      put update_project_visibility_project_url(@public_project), params: { public_access: 0 }
    end
  end

  test 'joe cannot create sample to public_project' do
    @public_project = projects(:public_project)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_no_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @public_project.name, input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update sample to public_project' do
    @public_sample = samples(:public_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@public_sample)}.json", params: {field: 'sample_tissue', value: 'bone'}
    end
    @public_sample.reload
    assert @public_sample.sample_tissue != 'bone'
  end

  test 'joe can see samples in public_project' do
    @public_project = projects(:public_project)
    get "/samples.json?project_id=#{@public_project.id}"
    assert_response :success
    assert JSON::parse(@response.body)["total_count"] == 1
  end

  test 'joe can see public_sample' do
    @public_sample = samples(:public_sample)
    get sample_url(@public_sample)
    assert_response :success
  end

  # private project

  test 'joe cannot add users to project one ' do
    @project = projects(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      put add_user_project_url(@project), params: { user_email_to_add: "abc@xyz.com"  }
    end

  end

  test 'joe cannot change project visibility to project one ' do
    @project = projects(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      put update_project_visibility_project_url(@project), params: { public_access: 0 }
    end

  end

  test 'joe cannot create sample to project one' do
    @project = projects(:one)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_no_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @project.name, input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update sample to project one' do
    @sample = samples(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@sample)}.json", params: {field: 'sample_tissue', value: 'bone'}
    end
    @sample.reload
    assert @sample.sample_tissue != 'bone'

  end

  test 'joe cannot see samples in project one' do
    @project = projects(:one)
    get "/samples.json?project_id=#{@project.id}"
    assert_response :success
    assert JSON::parse(@response.body)["total_count"] == 0

  end

  test 'joe cannot see sample one' do
    @sample = samples(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      get sample_url(@sample)
    end
  end

  # visible samples in private project

  test 'joe cannot add users to project two ' do
    @project = projects(:two)
    assert_raises(ActiveRecord::RecordNotFound) do
      put add_user_project_url(@project), params: { user_email_to_add: "abc@xyz.com"  }
    end
  end

  test 'joe cannot create sample to project two' do
    @project = projects(:two)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local" },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local" }]
    assert_no_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @project.name, input_files_attributes: input_files } }
    end
    assert_response 422

  end

  test 'joe cannot update expired_sample' do
    @sample = samples(:expired_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@sample)}.json", params: {field: 'sample_tissue', value: 'bone'}
    end
    @sample.reload
    assert @sample.sample_tissue != 'bone'
  end

  test 'joe can see expired samples in project two' do
    @project = projects(:two)
    get "/samples.json?project_id=#{@project.id}"
    assert_response :success
    assert JSON::parse(@response.body)["total_count"] == 1
  end

  test 'joe can see expired_sample' do
    @expired_sample = samples(:expired_sample)
    get sample_url(@expired_sample)
    assert_response :success

  end

end
