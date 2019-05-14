class SupportController < ApplicationController
  before_action :login_required, except: [:privacy, :terms, :faqs]
  skip_before_action :authenticate_user!, :verify_authenticity_token, only: [:privacy, :terms, :faqs]

  def privacy
  end

  def terms
  end

  def faqs
  end
end
