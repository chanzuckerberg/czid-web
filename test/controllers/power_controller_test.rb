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
    put add_user_project_url(@joe_project), params: { user_email_to_add: "abc@xyz.com" }
    assert_response :success
  end

  test 'joe can change project visibility to joe_project ' do
    @joe_project = projects(:joe_project)
    put update_project_visibility_project_url(@joe_project), params: { public_access: 0 }
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
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @joe_project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response :success
  end

  test 'joe can update sample to joe_project' do
    @joe_sample = samples(:joe_sample)
    post "#{save_metadata_sample_url(@joe_sample)}.json", params: { field: 'sample_tissue', value: 'bone' }
    assert_response :success
    @joe_sample.reload
    assert @joe_sample.sample_tissue == 'bone'
  end

  test 'joe can see samples in joe_project' do
    @joe_project = projects(:joe_project)
    get "/samples.json?project_id=#{@joe_project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["total_count"] == 3
  end

  test 'joe can see joe_sample' do
    @joe_sample = samples(:joe_sample)
    get sample_url(@joe_sample)
    assert_response :success
  end

  test 'joe can delete his own sample' do
    @joe_sample = samples(:joe_sample)
    delete sample_url(@joe_sample)
    assert_response :success
  end

  test 'joe cannot delete public_sample' do
    @public_sample = samples(:public_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      delete sample_url(@public_sample)
    end
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
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @public_project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update sample to public_project' do
    @public_sample = samples(:public_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@public_sample)}.json", params: { field: 'sample_tissue', value: 'bone' }
    end
    @public_sample.reload
    assert @public_sample.sample_tissue != 'bone'
  end

  test 'joe can see samples in public_project' do
    @public_project = projects(:public_project)
    get "/samples.json?project_id=#{@public_project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["total_count"] == 3
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
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update sample to project one' do
    @sample = samples(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@sample)}.json", params: { field: 'sample_tissue', value: 'bone' }
    end
    @sample.reload
    assert @sample.sample_tissue != 'bone'
  end

  test 'joe cannot see samples in project one' do
    @project = projects(:one)
    get "/samples.json?project_id=#{@project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["total_count"].zero?
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
      put add_user_project_url(@project), params: { user_email_to_add: "abc@xyz.com" }
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
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update expired_sample' do
    @sample = samples(:expired_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@sample)}.json", params: { field: 'sample_tissue', value: 'bone' }
    end
    @sample.reload
    assert @sample.sample_tissue != 'bone'
  end

  test 'joe can see expired samples in project two' do
    @project = projects(:two)
    get "/samples.json?project_id=#{@project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["total_count"] == 1
  end

  test 'joe can see expired_sample' do
    @expired_sample = samples(:expired_sample)
    get sample_url(@expired_sample)
    assert_response :success
  end

  # backgrounds

  test 'joe cannot create background from samples he cannot view' do
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:project_one_sampleA).id, samples(:project_one_sampleB).id] }
    resp = JSON.parse(@response.body)
    assert_equal "unauthorized", resp['status']
  end

  test 'joe can create background from public samples' do
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:expired_sample).id, samples(:public_sample).id] }
    resp = JSON.parse(@response.body)
    assert_equal "ok", resp['status']
  end

  test 'joe can create background from samples in joe_project' do
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:joe_project_sampleA).id, samples(:joe_project_sampleB).id] }
    resp = JSON.parse(@response.body)
    assert_equal "ok", resp['status']
  end

  test 'joe can view joe_sample with public background' do
    access_sample_with_background(backgrounds(:public_background), samples(:joe_sample))
    assert_response :success
  end

  test 'joe can view joe_sample with background for public_project' do
    access_sample_with_background(backgrounds(:background_for_public_project), samples(:joe_sample))
    assert_response :success
  end

  test 'joe can view joe_sample with background for joe_project' do
    access_sample_with_background(backgrounds(:background_for_joe_project), samples(:joe_sample))
    assert_response :success
  end

  test 'joe cannot view joe_sample with background for project one' do
    assert_raise do
      access_sample_with_background(backgrounds(:background_for_project_one), samples(:joe_sample))
    end
  end

  # phylo_trees
  test 'joe can see joe_phylo_tree' do
    pt = phylo_trees(:joe_phylo_tree)
    get "/phylo_trees/index.json?taxId=#{pt.taxid}&projectId=#{pt.project_id}"
    is_tree_in_response = JSON.parse(@response.body)['phyloTrees'].select { |tree| tree['id'] == pt.id }.count == 1
    assert_equal is_tree_in_response, true
  end

  test 'joe can see public_phylo_tree' do
    pt = phylo_trees(:public_phylo_tree)
    get "/phylo_trees/index.json?taxId=#{pt.taxid}&projectId=#{pt.project_id}"
    is_tree_in_response = JSON.parse(@response.body)['phyloTrees'].select { |tree| tree['id'] == pt.id }.count == 1
    assert_equal is_tree_in_response, true
  end

  test 'joe cannot see private phylo_tree one' do
    pt = phylo_trees(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      get "/phylo_trees/index.json?taxId=#{pt.taxid}&projectId=#{pt.project_id}"
    end
  end

  test 'joe cannot retry public_phylo_tree' do
    assert_raises(ActiveRecord::RecordNotFound) do
      post "/phylo_trees/retry?id=#{phylo_trees(:public_phylo_tree).id}"
    end
  end

  test 'joe can retry joe_failed_phylo_tree' do
    post "/phylo_trees/retry?id=#{phylo_trees(:joe_failed_phylo_tree).id}"
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'joe cannot create phylo_tree from pipeline_runs he cannot view' do
    entrypoint_taxon_count = taxon_counts(:three)
    post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:joe_project).id,
                                          taxId: entrypoint_taxon_count.tax_id, pipelineRunIds: [pipeline_runs(:three).id, pipeline_runs(:four).id],
                                          taxName: entrypoint_taxon_count.name }
    assert_equal "unauthorized", JSON.parse(@response.body)['status']
  end

  test 'joe can create phylo_tree to joe_project from public samples' do
    post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:joe_project).id,
                                          taxId: 1, pipelineRunIds: [pipeline_runs(:public_project_sampleA_run).id,
                                                                     pipeline_runs(:public_project_sampleB_run).id],
                                          tax_name: 'some species' }
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'joe can create phylo_tree to joe_project from samples in joe_project' do
    post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:joe_project).id,
                                          taxId: 1, pipelineRunIds: [pipeline_runs(:joe_project_sampleA_run).id,
                                                                     pipeline_runs(:joe_project_sampleB_run).id],
                                          tax_name: 'some species' }
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'joe cannot create phylo_tree to public_project' do
    assert_raises(ActiveRecord::RecordNotFound) do
      post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:public_project).id,
                                            taxId: 1, pipelineRunIds: [pipeline_runs(:joe_project_sampleA_run).id,
                                                                       pipeline_runs(:joe_project_sampleB_run).id],
                                            taxName: 'some species' }
    end
  end
end
