class SupportController < ApplicationController
  PUBLIC_ACTIONS = [:privacy, :terms, :terms_changes, :faqs, :public_ncov_homepage].freeze
  before_action :login_required, except: PUBLIC_ACTIONS
  skip_before_action :authenticate_user!, :verify_authenticity_token, only: PUBLIC_ACTIONS

  def privacy
  end

  def terms
  end

  def terms_changes
  end

  def faqs
  end

  def public_ncov_homepage
  end
end
