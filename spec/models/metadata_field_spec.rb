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
end
