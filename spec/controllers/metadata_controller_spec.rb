require 'rails_helper'

WebMock.allow_net_connect!

RSpec.describe MetadataController, type: :controller do
  create_users

  context "Joe" do
    before do
      sign_in @joe
      hg = create(:host_genome, name: "Human")
      mf = create(:metadata_field, name: "human_mf", display_name: "MF Human")

      loc = create(:metadata_field, name: "collection_location_v2", display_name: "Collection Location", is_core: 1, is_default: 1, is_required: 1, default_for_new_host_genome: 1)
      water = create(:metadata_field, name: "water_control", display_name: "Water Control", is_core: 1, is_default: 1, is_required: 1, default_for_new_host_genome: 1)

      human = HostGenome.find_by(name: "Human")
      [mf, loc, water].each do |field|
        hg.metadata_fields << field unless human.metadata_fields.include?(field)
      end
    end

    describe "GET metadata_template_csv" do
      it "generates a CSV with default + required fields if given no parameters" do
        get :metadata_template_csv
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be >= 1
        headers = csv.first
        expect(headers).to include("Sample Name")
        expect(headers).to include("Host Organism")
        expect(headers).to include("Collection Location")
        expect(headers).to include("Water Control")
      end

      it "generates CSV with sample names from project" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project, user: @joe)
        post :metadata_template_csv, params: { project_id: project.id }
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be(2)
        expect(csv[1][0]).to eq(sample.name)
      end

      it "generates CSV with sample names from params" do
        sample_name = "foo"
        post :metadata_template_csv, params: { new_sample_names: [sample_name] }
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be(2)
        expect(csv[1][0]).to eq(sample_name)
      end

      it "generates CSV with sample names from params and fields from host genome params" do
        sample_name = "foo"
        mf = create(:metadata_field)
        hg = create(:host_genome, metadata_fields: [mf.name])
        post :metadata_template_csv, params: { new_sample_names: [sample_name], host_genomes: [hg.name] }
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be(2)
        headers = csv.first
        expect(headers).to include("Sample Name")
        expect(headers).to include("Host Organism")
        expect(headers).to include("Collection Location")
        expect(headers).to include("Water Control")
        expect(headers).to include(mf.display_name)
      end

      it "ignores case in host genome names" do
        sample_name = "foo"
        host_genome_name = "Titled"
        mf = create(:metadata_field)
        create(:host_genome, name: host_genome_name, metadata_fields: [mf.name])
        get :metadata_template_csv, params: { new_sample_names: [sample_name], host_genomes: [host_genome_name.downcase] }
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be(2)
        headers = csv.first
        expect(headers).to include("Sample Name")
        expect(headers).to include("Host Organism")
        expect(headers).to include("Collection Location")
        expect(headers).to include("Water Control")
        expect(headers).to include(mf.display_name)

        expect(csv.last).to include(host_genome_name)
      end
    end

    describe "GET metadata_for_host_genome" do
      it "returns metadata fields for a host genome" do
        mf = create(:metadata_field)
        hg = create(:host_genome, metadata_fields: [mf.name])
        get :metadata_for_host_genome, params: { name: hg.name }
        expect(response).to have_http_status :success

        json = JSON.parse(response.body)
        expect(json.map { |x| x["name"] }).to include(mf.name)
      end

      it "returns not found if the host genome is not found" do
        get :metadata_for_host_genome, params: { name: "missing" }
        expect(response).to have_http_status :not_found
      end
    end
  end
end
