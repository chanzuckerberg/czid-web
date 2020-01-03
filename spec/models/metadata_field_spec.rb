require 'rails_helper'

# TODO: (gdingle): change this to yes/no only

# This spec was created well after MetadataField, for the boolean? method.
describe MetadataField, type: :model do
  it 'not be boolean if not force_options' do
    expect(create(:metadata_field, force_options: 0, options: '[1,0]').boolean?).to_not be
  end

  it 'not be boolean if nil or zero options or more than two' do
    expect(create(:metadata_field, force_options: 1, options: '[]').boolean?).to_not be
    expect(create(:metadata_field, force_options: 1, options: nil).boolean?).to_not be
    expect(create(:metadata_field, force_options: 1, options: '[1,2,3]').boolean?).to_not be
  end

  it 'be boolean if force_options and two options' do
    expect(create(:metadata_field, force_options: 1, options: '[1,0]').boolean?).to be
  end
end
