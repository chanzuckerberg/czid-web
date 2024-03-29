require 'rails_helper'

# This spec was created well after MetadataField, for the boolean? method.
describe MetadataField, type: :model do
  def find_test_field(host_genome)
    host_genome.metadata_fields.find { |mf| mf.name == 'test' }
  end

  let(:options) { '["Yes", "No"]' }

  it 'not be boolean if not force_options' do
    expect(create(:metadata_field, force_options: 0, options: options).boolean?).to_not be
  end

  it 'not be boolean if nil or zero options or more than two' do
    expect(create(:metadata_field, force_options: 1, options: '[]').boolean?).to_not be
    expect(create(:metadata_field, force_options: 1, options: nil).boolean?).to_not be
    expect(create(:metadata_field, force_options: 1, options: '[1,2,3]').boolean?).to_not be
  end

  it 'not be boolean if wrong order' do
    expect(create(:metadata_field, force_options: 1, options: '["No", "Yes"]').boolean?).to_not be
  end

  it 'be boolean if force_options and two options' do
    expect(create(:metadata_field, force_options: 1, options: options).boolean?).to be
  end

  it 'will not create a reserved name' do
    expect { create(:metadata_field, name: 'sample_name') }.to raise_error(ActiveRecord::RecordInvalid)
    expect { create(:metadata_field, name: 'my_name') }.to_not raise_error
  end

  it 'will not create a required field that is not default_for_new_host_genome' do
    expect { create(:metadata_field, name: 'test', is_default: 1, is_core: 1, default_for_new_host_genome: 0, is_required: 1) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it 'will not update to required a field that is not default_for_new_host_genome' do
    metadata_field = create(:metadata_field, name: 'test', is_default: 1, is_core: 1, default_for_new_host_genome: 0)
    expect { metadata_field.update!(is_required: 1) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it 'will create a required field that is default_for_new_host_genome' do
    expect { create(:metadata_field, name: 'test', is_default: 1, is_core: 1, default_for_new_host_genome: 1, is_required: 1) }.to_not raise_error
  end

  it 'will update to required a field that is default_for_new_host_genome' do
    metadata_field = create(:metadata_field, name: 'test', is_default: 1, is_core: 1, default_for_new_host_genome: 1)
    expect { metadata_field.update(is_required: 1) }.to_not raise_error
  end

  it 'will update all hosts needed when a required field is created' do
    host_genome = create(:host_genome)
    metadata_field = find_test_field(host_genome)
    expect(metadata_field).to be_nil

    create(:metadata_field, name: 'test', is_default: 1, is_core: 1, default_for_new_host_genome: 1, is_required: 1)
    host_genome = HostGenome.find(host_genome.id)
    metadata_field = find_test_field(host_genome)
    expect(metadata_field).to_not be_nil
  end

  it 'will update all hosts needed when a default_for_new_host_genome field is created' do
    host_genome = create(:host_genome)
    metadata_field = find_test_field(host_genome)
    expect(metadata_field).to be_nil

    create(:metadata_field, name: 'test', is_default: 0, is_core: 0, default_for_new_host_genome: 1, is_required: 0)
    host_genome = HostGenome.find(host_genome.id)
    metadata_field = find_test_field(host_genome)
    expect(metadata_field).to_not be_nil
  end

  it 'will not update all hosts needed when a non-required field is created' do
    host_genome = create(:host_genome)
    metadata_field = find_test_field(host_genome)
    expect(metadata_field).to be_nil

    create(:metadata_field, name: 'test', is_default: 0, is_core: 0, default_for_new_host_genome: 0, is_required: 0)
    host_genome = HostGenome.find(host_genome.id)
    metadata_field = find_test_field(host_genome)
    expect(metadata_field).to be_nil
  end

  context "MetadataField.by_samples" do
    before do
      @user = create(:user)
      @project = create(:project, users: [@user])
      @host_genome = create(:host_genome, name: "mock_host_genome")
      @host_metadata_field = create(
        :metadata_field, name: "host_metadata_field", base_type: MetadataField::STRING_TYPE
      )
    end

    it "should return an empty array if no samples are passed" do
      samples = Sample.where(name: "non-existent sample")
      results = MetadataField.by_samples(samples)
      expect(results).to eq([])
    end

    it "should not return metadata fields that are not associated with the samples' projects" do
      @host_genome.metadata_fields << @host_metadata_field

      sample = create(:sample, project: @project, host_genome: @host_genome)
      samples = Sample.where(:id [sample.id])

      results = MetadataField.by_samples(samples)
      expect(results.pluck(:key)).not_to include("host_metadata_field")
    end

    it "should not return metadata fields that are not associated with the samples' host genomes" do
      @project.metadata_fields.append(@host_metadata_field)

      sample = create(:sample, project: @project, host_genome: @host_genome)
      samples = Sample.where(:id [sample.id])

      results = MetadataField.by_samples(samples)
      expect(results.pluck(:key)).not_to include("host_metadata_field")
    end

    it "should return all metadata fields associated with the samples' projects and host genomes" do
      project_two = create(:project, users: [@user])
      host_genome_two = create(:host_genome, name: "mock_host_genome_two")
      host_metadata_field_two = create(
        :metadata_field, name: "host_metadata_field_two", base_type: MetadataField::STRING_TYPE
      )

      @host_genome.metadata_fields << @host_metadata_field
      host_genome_two.metadata_fields << host_metadata_field_two
      @project.metadata_fields.append(@host_metadata_field, host_metadata_field_two)

      sample_one = create(:sample, project: @project, host_genome: @host_genome)
      sample_two = create(:sample, project: project_two, host_genome: host_genome_two)
      samples = Sample.where(:id [sample_one.id, sample_two.id])

      results = MetadataField.by_samples(samples)
      expect(results.pluck(:key)).to eq([@host_metadata_field.name, host_metadata_field_two.name])
    end
  end
end
