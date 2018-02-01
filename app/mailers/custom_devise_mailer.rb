class CustomDeviseMailer < Devise::Mailer   
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: 'devise/mailer'

  def reset_password_instructions(record, token, opts={})
    set_email_template record
    opts[:template_name] = @template if @template
    super
  end

  private

  def set_email_template(user)
    @template = user.email_template rescue nil
  end
end
