class SupportController < ApplicationController
  PUBLIC_ACTIONS = [
    :faqs,
    :impact,
    :privacy_notice_for_user_research,
    :privacy,
    :terms_changes,
    :terms,
    :security_white_paper,
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
    render "home/discovery_view_router"
  end

  def privacy_notice_for_user_research
    render "home/discovery_view_router"
  end

  def impact
    @hide_header = true
    render "home/discovery_view_router"
  end

  def security_white_paper
    # Use `inline` disposition to make sure the PDF is shown inline and not downloaded
    filename = File.join(Rails.root, "app/assets/pdfs/security_white_paper.pdf")
    send_file(filename, disposition: "inline", type: "application/pdf")
  end
end
