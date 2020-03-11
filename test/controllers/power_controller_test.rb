require 'test_helper'

class PowerControllerTest < ActionDispatch::IntegrationTest
  include TestHelper

  test 'joe can create project' do
    sign_in(:joe)
    post "#{projects_url}.json", params: { project: { name: "2nd Joe Project", public_access: 0, description: "Joe's second project" } }
    assert_response :success
  end

  test 'joe can add users to joe_project ' do
    sign_in(:joe)
    @joe_project = projects(:joe_project)
    expect(@auth0_management_client_double)
      .to(receive(:create_user)
          .with(
            "User invited from Power Controller test",
            connection: "Username-Password-Authentication",
            email: "help@idseq.net",
            name: "User invited from Power Controller test",
            password: instance_of(String),
            app_metadata: { roles: [] }
          )
          .and_return("user_id" => "auth0|FAKE_AUTH0_USER_ID"))

    expect(@auth0_management_client_double)
      .to(receive(:post_password_change)
          .with(user_id: "auth0|FAKE_AUTH0_USER_ID")
          .and_return(
            "ticket" => "https://fake_idseq_test.idseq.net/fake_auth0_response_ticket_url?"
          ))
    put add_user_project_url(@joe_project), params: { user_email_to_add: "help@idseq.net", user_name_to_add: "User invited from Power Controller test" }
    assert_response :success
  end

  test 'joe can change project visibility to joe_project ' do
    sign_in(:joe)
    @joe_project = projects(:joe_project)
    put update_project_visibility_project_url(@joe_project), params: { public_access: 0 }
    assert_response :success
  end

  test 'joe can create sample to joe_project' do
    sign_in(:joe)
    @joe_project = projects(:joe_project)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @joe_project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response :success
  end

  test 'joe can update sample to joe_project' do
    sign_in(:joe)
    @joe_sample = samples(:joe_sample)
    post "#{save_metadata_sample_url(@joe_sample)}.json", params: { field: 'sample_notes', value: 'Test note' }
    assert_response :success
    @joe_sample.reload
    assert @joe_sample.sample_notes == 'Test note'
  end

  test 'joe can update sample to joe_project v2' do
    sign_in(:joe)
    @joe_sample = samples(:joe_sample)
    post "#{save_metadata_v2_sample_url(@joe_sample)}.json", params: { field: "sample_notes", value: "Test note 2" }
    assert_response :success
    @joe_sample.reload
    assert @joe_sample.metadata.find_by(key: "sample_notes").string_validated_value == 'Test note 2'
  end

  # ===== START: /samples/index
  test 'joe can see samples in joe_project' do
    sign_in(:joe)
    @joe_project = projects(:joe_project)
    get "/samples.json?project_id=#{@joe_project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["count"] == 5
  end

  test 'joe cannot see samples in project one' do
    sign_in(:joe)
    @project = projects(:one)
    get "/samples.json?project_id=#{@project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["count"].zero?
  end

  test 'joe can see expired samples in project two' do
    sign_in(:joe)
    @project = projects(:two)
    get "/samples.json?project_id=#{@project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["count"] == 2
  end

  test 'joe can see samples in public_project' do
    sign_in(:joe)
    @public_project = projects(:public_project)
    get "/samples.json?project_id=#{@public_project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["count"] == 5
  end
  # ===== END: /samples/index

  # ===== START: /samples/index_v2
  test 'joe can see samples in joe_project with index_v2' do
    sign_in(:joe)
    @joe_project = projects(:joe_project)
    get "/samples/index_v2.json?projectId=#{@joe_project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count == 5
  end

  test 'joe cannot see samples in project one with index_v2' do
    sign_in(:joe)
    @project = projects(:one)
    get "/samples/index_v2.json?projectId=#{@project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count.zero?
  end

  test 'joe can see expired samples in project two with index_v2' do
    sign_in(:joe)
    @project = projects(:two)
    get "/samples/index_v2.json?projectId=#{@project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count == 2
  end

  test 'joe can see samples in public_project with index_v2' do
    sign_in(:joe)
    @public_project = projects(:public_project)
    get "/samples/index_v2.json?projectId=#{@public_project.id}"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count == 5
  end

  test 'joe sees samples in its data set with index_v2' do
    sign_in(:joe)
    get "/samples/index_v2.json?domain=my_data"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count == 5
  end

  test 'joe sees samples that are public domain with index_v2' do
    sign_in(:joe)
    get "/samples/index_v2.json?domain=public"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count == 7
  end

  test 'joe sees the samples that he has access to with index_v2' do
    sign_in(:joe)
    get "/samples/index_v2.json"
    assert_response :success
    assert JSON.parse(@response.body)["samples"].count == 12
  end
  # ===== END: /samples/index_v2

  test 'joe can see joe_sample' do
    sign_in(:joe)
    @joe_sample = samples(:joe_sample)
    get sample_url(@joe_sample)
    assert_response :success
  end

  test 'joe can delete his own sample' do
    sign_in(:joe)
    @joe_sample = samples(:joe_sample)
    delete sample_url(@joe_sample)
    # successful delete returns a 302 redirect
    assert_response :redirect
  end

  test 'joe cannot delete public_sample' do
    sign_in(:joe)
    @public_sample = samples(:public_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      delete sample_url(@public_sample)
    end
  end

  test 'joe cannot delete expired_sample' do
    sign_in(:joe)
    @expired_sample = samples(:expired_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      delete sample_url(@expired_sample)
    end
  end

  # search suggestions
  test 'joe sees public_sample in search suggestions' do
    sign_in(:joe)
    get "/search_suggestions"
    res = JSON.parse(@response.body)
    samples_shown = res["Sample"]["results"].map { |h| h["sample_ids"] }.flatten
    assert samples_shown.include?(samples(:public_sample).id)
  end

  test 'joe does not see sample one in search suggestions' do
    sign_in(:joe)
    get "/search_suggestions"
    res = JSON.parse(@response.body)
    samples_shown = res["Sample"]["results"].map { |h| h["sample_ids"] }.flatten
    assert !samples_shown.include?(samples(:one).id)
  end

  test 'joe sees public_project in search suggestions' do
    sign_in(:joe)
    get "/search_suggestions"
    res = JSON.parse(@response.body)
    projects_shown = res["Project"]["results"].map { |h| h["id"] }
    assert projects_shown.include?(projects(:public_project).id)
  end

  test 'joe does not see project one in search suggestions' do
    sign_in(:joe)
    get "/search_suggestions"
    res = JSON.parse(@response.body)
    projects_shown = res["Project"]["results"].map { |h| h["id"] }
    assert !projects_shown.include?(projects(:one).id)
  end

  test 'joe sees only my data samples in search suggestions in my data domain' do
    sign_in(:joe)
    get "/search_suggestions?domain=my_data"
    res = JSON.parse(@response.body)
    samples_shown = res["Sample"]["results"].map { |h| h["sample_ids"] }.flatten
    assert samples_shown.include?(samples(:joe_sample).id)
    assert !samples_shown.include?(samples(:public_sample).id)
  end

  test 'joe sees only public samples in search suggestions in public domain' do
    sign_in(:joe)
    get "/search_suggestions?domain=public"
    res = JSON.parse(@response.body)
    samples_shown = res["Sample"]["results"].map { |h| h["sample_ids"] }.flatten
    assert samples_shown.include?(samples(:public_sample).id)
    assert !samples_shown.include?(samples(:joe_sample).id)
  end

  test 'joe sees my data and public samples in search suggestions in default domain' do
    sign_in(:joe)
    get "/search_suggestions"
    res = JSON.parse(@response.body)
    samples_shown = res["Sample"]["results"].map { |h| h["sample_ids"] }.flatten
    assert samples_shown.include?(samples(:public_sample).id)
    assert samples_shown.include?(samples(:joe_sample).id)
    assert !samples_shown.include?(samples(:project_one_sampleA).id)
  end

  # public projects

  test 'joe cannot add users to public_project ' do
    sign_in(:joe)
    @public_project = projects(:public_project)
    assert_raises(ActiveRecord::RecordNotFound) do
      put add_user_project_url(@public_project), params: { user_email_to_add: "abc@xyz.com"  }
    end
  end

  test 'joe cannot change project visibility to public_project ' do
    sign_in(:joe)
    @public_project = projects(:public_project)
    assert_raises(ActiveRecord::RecordNotFound) do
      put update_project_visibility_project_url(@public_project), params: { public_access: 0 }
    end
  end

  test 'joe cannot create sample to public_project' do
    sign_in(:joe)
    @public_project = projects(:public_project)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_no_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @public_project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update sample to public_project' do
    sign_in(:joe)
    @public_sample = samples(:public_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@public_sample)}.json", params: { field: 'sample_notes', value: 'Test note' }
    end
    @public_sample.reload
    assert @public_sample.sample_notes != 'Test note'
  end

  test 'joe can see public_sample' do
    sign_in(:joe)
    @public_sample = samples(:public_sample)
    get sample_url(@public_sample)
    assert_response :success
  end

  test 'joe cannot see intermediate host filtering outputs for public_sample' do
    sign_in(:joe)
    @public_sample = samples(:public_sample)
    get "/samples/#{@public_sample.id}/results_folder.json"
    displayed_data = JSON.parse(@response.body)["displayed_data"]
    intermediate_targets = %w[fastqs star_out trimmomatic_out priceseq_out cdhitdup_out lzw_out bowtie2_out subsampled_out]
    original_url_by_key = TEST_RESULT_FOLDER.map { |file_info| [file_info[:key], file_info[:url]] }.to_h
    visible_intermediate_files = []
    displayed_data.each do |target, target_info|
      target_info["file_list"].each do |file_info|
        original_url = original_url_by_key[file_info["key"]]
        final_url = file_info["url"]
        if intermediate_targets.include?(target) && final_url == original_url
          visible_intermediate_files << final_url
        end
      end
    end
    assert_empty visible_intermediate_files
  end

  test 'joe cannot see raw_result_folder for public_sample' do
    sign_in(:joe)
    get "/samples/#{samples(:public_sample).id}/raw_results_folder"
    assert_response :unauthorized
  end

  # private project

  test 'joe cannot add users to project one ' do
    sign_in(:joe)
    @project = projects(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      put add_user_project_url(@project), params: { user_email_to_add: "abc@xyz.com"  }
    end
  end

  test 'joe cannot change project visibility to project one ' do
    sign_in(:joe)
    @project = projects(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      put update_project_visibility_project_url(@project), params: { public_access: 0 }
    end
  end

  test 'joe cannot create sample to project one' do
    sign_in(:joe)
    @project = projects(:one)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_no_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update sample to project one' do
    sign_in(:joe)
    @sample = samples(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@sample)}.json", params: { field: 'sample_notes', value: 'Test note' }
    end
    @sample.reload
    assert @sample.sample_notes != 'Test note'
  end

  test 'joe cannot see sample one' do
    sign_in(:joe)
    @sample = samples(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      get sample_url(@sample)
    end
  end

  # visible samples in private project

  test 'joe cannot add users to project two ' do
    sign_in(:joe)
    @project = projects(:two)
    assert_raises(ActiveRecord::RecordNotFound) do
      put add_user_project_url(@project), params: { user_email_to_add: "abc@xyz.com" }
    end
  end

  test 'joe cannot create sample to project two' do
    sign_in(:joe)
    @project = projects(:two)
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_no_difference('Sample.count') do
      post "#{samples_url}.json", params: { sample: { name: 'joe new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_response 422
  end

  test 'joe cannot update expired_sample' do
    sign_in(:joe)
    @sample = samples(:expired_sample)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "#{save_metadata_sample_url(@sample)}.json", params: { field: 'sample_notes', value: 'Test note' }
    end
    @sample.reload
    assert @sample.sample_notes != 'Test note'
  end

  test 'joe can see expired_sample' do
    sign_in(:joe)
    @expired_sample = samples(:expired_sample)
    get sample_url(@expired_sample)
    assert_response :success
  end

  # backgrounds

  test 'joe cannot create background from samples he cannot view' do
    sign_in(:joe)
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:project_one_sampleA).id, samples(:project_one_sampleB).id] }
    resp = JSON.parse(@response.body)
    assert_equal "unauthorized", resp['status']
  end

  test 'joe can create background from public samples' do
    sign_in(:joe)
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:expired_sample).id, samples(:public_sample).id] }
    resp = JSON.parse(@response.body)
    assert_equal "ok", resp['status']
  end

  test 'joe can create background from samples in joe_project' do
    sign_in(:joe)
    post backgrounds_url, params: { name: 'new_name', sample_ids: [samples(:joe_project_sampleA).id, samples(:joe_project_sampleB).id] }
    resp = JSON.parse(@response.body)
    assert_equal "ok", resp['status']
  end

  test 'joe can view joe_sample with public background' do
    sign_in(:joe)
    access_sample_with_background(backgrounds(:public_background), samples(:joe_sample))
    assert_response :success
  end

  test 'joe can view joe_sample with background for public_project' do
    sign_in(:joe)
    access_sample_with_background(backgrounds(:background_for_public_project), samples(:joe_sample))
    assert_response :success
  end

  test 'joe can view joe_sample with background for joe_project' do
    sign_in(:joe)
    access_sample_with_background(backgrounds(:background_for_joe_project), samples(:joe_sample))
    assert_response :success
  end

  # phylo_trees
  test 'joe can see joe_phylo_tree' do
    sign_in(:joe)
    get "/phylo_trees/index.json"
    pt = phylo_trees(:joe_phylo_tree)
    is_tree_in_response = JSON.parse(@response.body)['phyloTrees'].select { |tree| tree['id'] == pt.id }.count == 1
    assert_equal is_tree_in_response, true
  end

  test 'joe can see public_phylo_tree' do
    sign_in(:joe)
    get "/phylo_trees/index.json"
    pt = phylo_trees(:public_phylo_tree)
    is_tree_in_response = JSON.parse(@response.body)['phyloTrees'].select { |tree| tree['id'] == pt.id }.count == 1
    assert_equal is_tree_in_response, true
  end

  test 'joe cannot see private phylo_tree one' do
    sign_in(:joe)
    pt = phylo_trees(:one)
    assert_raises(ActiveRecord::RecordNotFound) do
      get "/phylo_trees/#{pt.id}/show"
    end
    get "/phylo_trees/index.json"
    is_tree_absent_from_response = JSON.parse(@response.body)['phyloTrees'].select { |tree| tree['id'] == pt.id }.count.zero?
    assert_equal is_tree_absent_from_response, true
  end

  test 'joe cannot retry public_phylo_tree' do
    sign_in(:joe)
    assert_raises(ActiveRecord::RecordNotFound) do
      post "/phylo_trees/retry?id=#{phylo_trees(:public_phylo_tree).id}"
    end
  end

  test 'joe can retry joe_failed_phylo_tree' do
    sign_in(:joe)
    post "/phylo_trees/retry?id=#{phylo_trees(:joe_failed_phylo_tree).id}"
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'joe cannot create phylo_tree from pipeline_runs he cannot view' do
    sign_in(:joe)
    entrypoint_taxon_count = taxon_counts(:three)
    post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:joe_project).id,
                                          taxId: entrypoint_taxon_count.tax_id, pipelineRunIds: [pipeline_runs(:three).id, pipeline_runs(:four).id],
                                          taxName: entrypoint_taxon_count.name, }
    assert_equal "unauthorized", JSON.parse(@response.body)['status']
  end

  test 'joe can create phylo_tree to joe_project from public samples' do
    sign_in(:joe)
    post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:joe_project).id,
                                          taxId: 573, pipelineRunIds: [pipeline_runs(:public_project_sampleA_run).id,
                                                                       pipeline_runs(:public_project_sampleB_run).id,],
                                          taxName: 'some species', }
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'joe can create phylo_tree to joe_project from samples in joe_project' do
    sign_in(:joe)
    post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:joe_project).id,
                                          taxId: 573, pipelineRunIds: [pipeline_runs(:joe_project_sampleA_run).id,
                                                                       pipeline_runs(:joe_project_sampleB_run).id,],
                                          taxName: 'some species', }
    assert_equal "ok", JSON.parse(@response.body)['status']
  end

  test 'joe cannot create phylo_tree to public_project' do
    sign_in(:joe)
    assert_raises(ActiveRecord::RecordNotFound) do
      sign_in(:joe)
      post "/phylo_trees/create", params: { name: 'new_phylo_tree', projectId: projects(:public_project).id,
                                            taxId: 573, pipelineRunIds: [pipeline_runs(:joe_project_sampleA_run).id,
                                                                         pipeline_runs(:joe_project_sampleB_run).id,],
                                            taxName: 'some species', }
    end
  end

  # Visualizations
  test 'joe can see own visualizations and not others on my data domain' do
    sign_in(:joe)
    @joe_visualization = visualizations(:joe_visualization)
    get "/visualizations.json?domain=my_data"
    response = JSON.parse(@response.body)

    assert_response :success
    assert_equal(response.count, 1)
    assert_equal(response[0]["id"], @joe_visualization.id)
  end

  test 'joe can see public visualizations and not other on public domain' do
    sign_in(:joe)
    @public_visualization = visualizations(:public_visualization)
    get "/visualizations.json?domain=public"
    response = JSON.parse(@response.body)

    assert_response :success
    assert_equal(response.count, 1)
    assert_equal(response[0]["id"], @public_visualization.id)
  end

  test 'joe should see own plus public visualizations by default' do
    sign_in(:joe)
    @visualizations = visualizations(:joe_visualization, :public_visualization)
    get "/visualizations.json"
    response = JSON.parse(@response.body)

    assert_response :success
    assert_equal(response.count, 2)
    assert_equal(response.pluck("id").sort, @visualizations.pluck(:id).sort)
  end

  test 'joe should see own plus public visualizations on all data domain' do
    sign_in(:joe)
    @visualizations = visualizations(:joe_visualization, :public_visualization)
    get "/visualizations.json?domain=all_data"
    response = JSON.parse(@response.body)

    assert_response :success
    assert_equal(response.count, 2)
    assert_equal(response.pluck("id").sort, @visualizations.pluck(:id).sort)
  end

  test 'admin can see all visualizations by default' do
    sign_in(:admin)

    @admin_visualizations = visualizations(:joe_visualization, :admin_visualization, :public_visualization, :private_visualization)
    get "/visualizations.json"
    response = JSON.parse(@response.body)

    assert_response :success
    assert_equal(response.count, 4)
    assert_equal(response.pluck("id").sort, @admin_visualizations.pluck(:id).sort)
  end

  test 'admin can see all visualizations on all data domain' do
    sign_in(:admin)

    @admin_visualizations = visualizations(:joe_visualization, :admin_visualization, :public_visualization, :private_visualization)
    get "/visualizations.json?domain=all_data"
    response = JSON.parse(@response.body)

    assert_response :success
    assert_equal(response.count, 4)
    assert_equal(response.pluck("id").sort, @admin_visualizations.pluck(:id).sort)
  end
end
