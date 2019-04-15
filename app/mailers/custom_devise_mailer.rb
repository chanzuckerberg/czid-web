class CustomDeviseMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: 'devise/mailer'

  def reset_password_instructions(record, token, opts = {})
    assign_email_arguments record
    Rails.logger.info("Going to send password reset email to: #{record.email}")

    # Block for adding extra arguments
    if @email_arguments
      opts[:template_name] = @email_arguments[:email_template] if @email_arguments[:email_template]
      opts[:subject] = @email_arguments[:email_subject] if @email_arguments[:email_subject]
      @sharing_user = User.find(@email_arguments[:sharing_user_id])
      @shared_project_name = Project.find(@email_arguments[:shared_project_id]).name
      @shared_project_id = @email_arguments[:shared_project_id]
    end
    super # Calls DeviseMailer
  rescue => exception
    LogUtil.log_err_and_airbrake("Error sending reset_password_instructions to #{record.email} #{@email_arguments || ''}")
    LogUtil.log_backtrace(exception)
  end

  private

  def assign_email_arguments(user)
    @email_arguments = user.email_arguments
  end
end
