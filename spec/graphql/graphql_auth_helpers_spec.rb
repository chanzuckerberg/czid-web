require 'rails_helper'
require "graphql_auth_helpers"
require 'ostruct'

RSpec.describe GraphqlAuthHelpers, type: :helper do
  describe "#current_user_is_logged_in?" do
    subject { helper.current_user_is_logged_in? context }

    context "when user is not logged in" do
      let(:context) { OpenStruct.new(current_user: nil) }
      it { is_expected.to eq(false) }
    end

    context "when user is logged in" do
      let(:context) { OpenStruct.new(current_user: :truthy_value) }
      it { is_expected.to eq(true) }
    end
  end

  describe "#current_user_is_admin_in?" do
    subject { helper.current_user_is_admin? context }

    context "when user is not logged in" do
      let(:context) { OpenStruct.new(current_user: nil) }
      it { is_expected.to eq(false) }
    end

    context "when user is logged in but not admnin" do
      current_user = OpenStruct.new(admin?: false)
      let(:context) { OpenStruct.new(current_user: current_user) }
      it { is_expected.to eq(false) }
    end

    context "when user is logged in and is admnin" do
      current_user = OpenStruct.new(admin?: true)
      let(:context) { OpenStruct.new(current_user: current_user) }
      it { is_expected.to eq(true) }
    end
  end
end
