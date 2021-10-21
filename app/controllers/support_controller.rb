class SupportController < ApplicationController
  PUBLIC_ACTIONS = [
    :faqs,
    :privacy_notice_for_user_research,
    :privacy,
    :terms_changes,
    :terms,
  ].freeze

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

  def privacy_notice_for_user_research
    render "home/discovery_view_router"
  end
end
