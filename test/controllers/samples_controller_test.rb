require 'test_helper'

class SamplesControllerTest < ActionDispatch::IntegrationTest
  include ActiveSupport::Testing::TimeHelpers

  setup do
    @background = backgrounds(:real_background)
    @sample = samples(:one)
    @sample_human_existing_metadata_public = samples(:sample_human_existing_metadata_public)
    @metadata_validation_sample_human_existing_metadata = samples(:metadata_validation_sample_human_existing_metadata)
    @sample_human_existing_metadata_joe_project = samples(:sample_human_existing_metadata_joe_project)
    @sample_human_existing_metadata_expired = samples(:sample_human_existing_metadata_expired)
    @deletable_sample = samples(:deletable_sample)
    @project = projects(:one)
    @user = users(:admin_one)
    @user.authentication_token = 'sdfsdfsdff'
    @user.save
    @user_nonadmin = users(:joe)
  end

  test 'should get index' do
    sign_in @user
    get samples_url
    assert_response :success
  end

  test 'should get new' do
    sign_in @user
    get new_sample_url
    assert_response :success
  end

  test 'should create sample' do
    req_headers = { 'X-User-Email' => @user.email,
                    'X-User-Token' => @user.authentication_token, }
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }, headers: req_headers
    end
    assert_redirected_to sample_url(Sample.last)
  end

  test 'should redirect ' do
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_difference('Sample.count', 0) do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_redirected_to new_user_session_url
  end

  test 'pipeline_runs' do
    get pipeline_runs_sample_url(@sample)
    assert :success
  end

  test 'reupload source' do
    sign_in @user
    put reupload_source_sample_url(@sample)
    assert :success
  end

  test 'reupload source 2' do
    put reupload_source_sample_url(@sample)
    assert_redirected_to new_user_session_url
  end

  test 'kick off pipeline' do
    sign_in @user
    put kickoff_pipeline_sample_url(@sample)
    assert :success
  end

  test 'kick off pipeline without authentication' do
    put kickoff_pipeline_sample_url(@sample)
    assert_redirected_to new_user_session_url
  end

  test 'should create sample through web' do
    skip("This endpoint is deprecated in favor of upload with metadata")

    sign_in @user
    input_files = [{ source: "RR004_water_2_S23_R1_001.fastq.gz",
                     name: "RR004_water_2_S23_R1_001.fastq.gz",
                     source_type: "local", },
                   { source: "RR004_water_2_S23_R2_001.fastq.gz",
                     name: "RR004_water_2_S23_R2_001.fastq.gz",
                     source_type: "local", },]
    assert_difference('Sample.count') do
      post samples_url, params: { sample: { name: 'new sample', project_name: @project.name, client: "web", input_files_attributes: input_files } }
    end
    assert_redirected_to sample_url(Sample.last)
  end

  test 'should show sample' do
    sign_in @user
    get sample_url(@sample)
    assert_response :success
  end

  test 'should get correct report' do
    sign_in @user
    get "/samples/#{samples(:six).id}/report_info?background_id=#{@background.id}"
    json_response = JSON.parse(response.body)

    # Examples pulled from sample 1299 on prod
    # Test species taxid 573, which has genus taxid 570
    species_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 573 }[0]
    genus_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 570 }[0]

    assert_equal 209.0, species_result["NT"]["r"]
    assert_equal "186274.509", species_result["NT"]["rpm"]
    assert_equal 99.0, species_result["NT"]["zscore"]
    assert_equal 2_428_411_754.8, species_result["NT"]["aggregatescore"].round(1)
    assert_equal 89.5641022, species_result["NT"]["neglogevalue"]
    assert_equal 69.0, species_result["NR"]["r"]
    assert_equal "61497.326", species_result["NR"]["rpm"]
    assert_equal 99.0, species_result["NR"]["zscore"]
    assert_equal 2_428_411_754.8, species_result["NR"]["aggregatescore"].round(1)
    assert_equal 16.9101009, species_result["NR"]["neglogevalue"]

    assert_equal "Klebsiella pneumoniae", species_result["lineage"]["species_name"]
    assert_equal "Klebsiella", species_result["lineage"]["genus_name"]
    assert_equal "Enterobacteriaceae", species_result["lineage"]["family_name"]
    assert_equal "Enterobacterales", species_result["lineage"]["order_name"]
    assert_equal "Gammaproteobacteria", species_result["lineage"]["class_name"]
    assert_equal "Proteobacteria", species_result["lineage"]["phylum_name"]
    assert_equal "Bacteria", species_result["lineage"]["superkingdom_name"]

    assert_equal 217.0, genus_result["NT"]["r"]
    assert_equal "193404.634", genus_result["NT"]["rpm"]
    assert_equal 99.0, genus_result["NT"]["zscore"]
    assert_equal 2_428_411_754.8, genus_result["NT"]["aggregatescore"].round(1)
    assert_equal 89.5821991, genus_result["NT"]["neglogevalue"]
    assert_equal 87.0, genus_result["NR"]["r"]
    assert_equal "77540.106", genus_result["NR"]["rpm"]
    assert_equal 99.0, genus_result["NR"]["zscore"]
    assert_equal 2_428_411_754.8, genus_result["NR"]["aggregatescore"].round(1)
    assert_equal 16.9874001, genus_result["NR"]["neglogevalue"]

    # Test species taxid 1313, which has genus taxid 1301
    species_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 1313 }[0]
    genus_result = json_response["taxonomy_details"][2].select { |entry| entry["tax_id"] == 1301 }[0]

    assert_equal 0, species_result["NT"]["r"]
    assert_equal 0, species_result["NT"]["rpm"]
    assert_equal(-100, species_result["NT"]["zscore"])
    assert_equal 12_583.63, species_result["NT"]["aggregatescore"].round(2)
    assert_equal 0.0, species_result["NT"]["neglogevalue"]
    assert_equal 2.0, species_result["NR"]["r"]
    assert_equal "1782.531", species_result["NR"]["rpm"]
    assert_equal 4.2099668, species_result["NR"]["zscore"]
    assert_equal 12_583.63, species_result["NR"]["aggregatescore"].round(2)
    assert_equal 9.3000002, species_result["NR"]["neglogevalue"]

    assert_equal "Streptococcus pneumoniae", species_result["lineage"]["species_name"]
    assert_equal "Streptococcus", species_result["lineage"]["genus_name"]
    assert_equal "Streptococcaceae", species_result["lineage"]["family_name"]
    assert_equal "Lactobacillales", species_result["lineage"]["order_name"]
    assert_equal "Bacilli", species_result["lineage"]["class_name"]
    assert_equal "Firmicutes", species_result["lineage"]["phylum_name"]
    assert_equal "Bacteria", species_result["lineage"]["superkingdom_name"]

    assert_equal 4.0, genus_result["NT"]["r"]
    assert_equal "3565.062", genus_result["NT"]["rpm"]
    assert_equal 2.2081236, genus_result["NT"]["zscore"]
    assert_equal 73_603.777, genus_result["NT"]["aggregatescore"].round(3)
    assert_equal 81.4779968, genus_result["NT"]["neglogevalue"]
    assert_equal 2.0, genus_result["NR"]["r"]
    assert_equal "1782.531", genus_result["NR"]["rpm"]
    assert_equal 1.6768345, genus_result["NR"]["zscore"]
    assert_equal 73_603.777, genus_result["NR"]["aggregatescore"].round(3)
    assert_equal 9.3000002, genus_result["NR"]["neglogevalue"]
  end

  test 'should get edit' do
    sign_in @user
    get edit_sample_url(@sample)
    assert_response :success
  end

  test 'should update sample' do
    sign_in @user
    assert @sample.valid?
    patch sample_url(@sample, format: "json"), params: { sample: { name: @sample.name + ' asdf' } }
    assert_response :success
  end

  test 'should destroy sample' do
    sign_in @user
    assert_difference('Sample.count', -1) do
      delete sample_url(@deletable_sample)
    end
    assert_redirected_to samples_url
  end

  test 'joe can fetch metadata for a public sample' do
    sign_in @user_nonadmin

    get metadata_sample_url(@sample_human_existing_metadata_public)
    assert_response :success

    assert_equal ["nucleotide_type", "sex"], @response.parsed_body['metadata'].pluck("key")
  end

  test 'joe can fetch metadata for an expired sample' do
    sign_in @user_nonadmin

    get metadata_sample_url(@sample_human_existing_metadata_expired)
    assert_response :success

    assert_equal ["age", "sex"], @response.parsed_body['metadata'].pluck("key")
  end

  test 'joe can fetch metadata for his own private samples' do
    sign_in @user_nonadmin

    get metadata_sample_url(@sample_human_existing_metadata_joe_project)
    assert_response :success

    assert_equal ["sample_type", "sex"], @response.parsed_body['metadata'].pluck("key")
  end

  # non-admin user should not be able to query another user's private sample.
  test 'joe cannot fetch metadata for another user\'s private samples' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      get metadata_sample_url(@metadata_validation_sample_human_existing_metadata)
    end
  end

  test 'joe can fetch the metadata fields for a public sample' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_public.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  test 'joe can fetch the metadata fields for an expired sample' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_expired.id],
    }
    assert_response :success

    assert_equal ["Age"], @response.parsed_body.pluck("name")
  end

  test 'joe can fetch the metadata fields for his own private sample' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_joe_project.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Age", "Sex", "Sample Type", "Admission Date"], @response.parsed_body.pluck("name")
  end

  test 'joe cannot fetch the metadata fields for another user\'s private sample' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      get metadata_fields_samples_url, params: {
        sampleIds: [@metadata_validation_sample_human_existing_metadata.id],
      }
    end
  end

  # If multiple samples, merge the fields.
  test 'joe can fetch the metadata fields for multiple samples' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_public.id, @sample_human_existing_metadata_expired.id],
    }
    assert_response :success

    assert_equal ["Age", "Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  # If multiple samples but one is invalid, return fields for the valid ones.
  test 'joe can fetch the metadata fields for multiple samples, and invalid ones will be omitted' do
    sign_in @user_nonadmin

    get metadata_fields_samples_url, params: {
      sampleIds: [@sample_human_existing_metadata_public.id, @metadata_validation_sample_human_existing_metadata.id],
    }
    assert_response :success

    assert_equal ["Nucleotide Type", "Sample Type"], @response.parsed_body.pluck("name")
  end

  test 'joe cannot save metadata to a public sample' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      post save_metadata_v2_sample_url(@sample_human_existing_metadata_public), params: {
        field: "sample_type",
        value: "Foobar Sample Type",
      }
    end
  end

  test 'joe cannot save metadata to an expired sample' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      post save_metadata_v2_sample_url(@sample_human_existing_metadata_expired), params: {
        field: "sample_type",
        value: "Foobar Sample Type",
      }
    end
  end

  test 'joe can save metadata to his own private sample' do
    sign_in @user_nonadmin

    post save_metadata_v2_sample_url(@sample_human_existing_metadata_joe_project), params: {
      field: "sample_type",
      value: "Foobar Sample Type",
    }

    assert_response :success

    assert_equal "Foobar Sample Type", @sample_human_existing_metadata_joe_project.metadata.find_by(key: "sample_type").raw_value
  end

  test 'joe cannot save metadata to another user\'s private sample' do
    sign_in @user_nonadmin

    assert_raises(ActiveRecord::RecordNotFound) do
      post save_metadata_v2_sample_url(@metadata_validation_sample_human_existing_metadata), params: {
        field: "sample_type",
        value: "Foobar Sample Type",
      }
    end
  end

  test 'report_info should return cached copy on second request' do
    sign_in @user

    url = report_info_url
    get url

    assert_response :success

    first_len = @response.headers["Content-Length"].to_i
    assert first_len > 0
    cache_header = @response.headers["X-IDseq-Cache"]
    assert_equal "missed", cache_header

    get url
    assert_response :success

    second_len = @response.headers["Content-Length"].to_i
    cache_header = @response.headers["X-IDseq-Cache"]
    assert_equal "requested", cache_header
    assert second_len > 0

    assert_equal first_len, second_len
  end

  test 'report_info should override background when background is not viewable' do
    sign_in @user
    # ids beyond any conceivable range
    url = report_info_url(background_id: rand(10**10..11**10))
    get url

    assert_response :success
  end

  test 'report_info should return last-modified' do
    travel_to(Time.current) do
      report_ts = Time.now.utc

      sign_in @user

      url = report_info_url(report_ts: report_ts.to_i)
      get url
      last_modified = Time.httpdate(@response.headers["Last-Modified"])
      # Last-Modified of test data will be creation time, so we just match to the day
      assert_equal report_ts.year, last_modified.year
      assert_equal report_ts.month, last_modified.month
      assert_equal report_ts.day, last_modified.day
    end
  end

  test 'report_info cache should error on bad sample' do
    sign_in @user

    assert_raises(ActiveRecord::RecordNotFound) do
      test_miss("pipeline_version")
    end

    assert_raises(ActiveRecord::RecordNotFound) do
      get "/samples/123456789/report_info.json"
    end
    # Make sure not cached
    assert_raises(ActiveRecord::RecordNotFound) do
      get "/samples/123456789/report_info.json"
    end
  end

  test 'report_info cache should invalidate on change of relevant params' do
    sign_in @user

    test_miss("background_id")
    test_miss("scoring_model")
    test_miss("sort_by")
    test_miss("report_ts")
    test_miss("git_version")
  end

  test 'report_info cache should remain on change of irrelevant params' do
    sign_in @user

    url = report_info_url
    get url
    assert_response :success
    cache_header = @response.headers["X-IDseq-Cache"]
    assert_equal "missed", cache_header

    url += "&asdf=" + rand(10**10).to_s
    get url
    assert_response :success
    cache_header = @response.headers["X-IDseq-Cache"]
    assert_equal "requested", cache_header
  end

  private

  def report_info_url(params = {}, sample_name = :six)
    # Adapted from report_info_params
    query = {
      pipeline_version: nil,
      background_id: rand(10**10..11**10), # ids beyond any conceivable range
      scoring_model: TaxonScoringModel::DEFAULT_MODEL_NAME,
      sort_by: "nt_aggregatescore",
      report_ts: rand(10**10),
      git_version: "constant",
      format: "json",
    }.merge(params).to_query

    path = "/samples/#{samples(sample_name).id}/report_info"
    path + "?" + query
  end

  def test_miss(key)
    url = report_info_url(key => rand(10**10).to_s)
    get url
    assert_response :success
    cache_header = @response.headers["X-IDseq-Cache"]
    assert_equal "missed", cache_header
  end
end
