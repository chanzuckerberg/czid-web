require 'rails_helper'

# This spec was created well after MetadataField, for the boolean? method.
describe MetadataField, type: :model do
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
end
