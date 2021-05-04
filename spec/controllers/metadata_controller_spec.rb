require 'rails_helper'

WebMock.allow_net_connect!

RSpec.describe MetadataController, type: :controller do
  create_users

  context "Joe" do
    before do
      sign_in @joe
      mf = create(:metadata_field, name: "human_mf", display_name: "MF Human")
      human = HostGenome.find_by(name: "Human")
      human.metadata_fields << mf unless human.metadata_fields.include?(mf)
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
        get :metadata_template_csv, params: { project_id: project.id }
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be(2)
        expect(csv[1][0]).to eq(sample.name)
      end

      it "generates CSV with sample names from params" do
        sample_name = "foo"
        get :metadata_template_csv, params: { new_sample_names: [sample_name] }
        expect(response).to have_http_status :success

        csv = CSV.new(response.body).read
        expect(csv.length).to be(2)
        expect(csv[1][0]).to eq(sample_name)
      end

      it "generates CSV with sample names from params and fields from host genome params" do
        sample_name = "foo"
        mf = create(:metadata_field)
        hg = create(:host_genome, metadata_fields: [mf.name])
        get :metadata_template_csv, params: { new_sample_names: [sample_name], host_genomes: [hg.name] }
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
  end
end
