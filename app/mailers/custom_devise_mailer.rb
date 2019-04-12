class CustomDeviseMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: 'devise/mailer'

  def reset_password_instructions(record, token, opts = {})
    assign_email_arguments record
    if @email_arguments
      begin
        Rails.logger.info("Going to send password reset email to: #{record.email}")
        opts[:template_name] = @email_arguments[:email_template] if @email_arguments[:email_template]
        opts[:subject] = @email_arguments[:email_subject] if @email_arguments[:email_subject]
        @sharing_user = User.find(@email_arguments[:sharing_user_id])
        @shared_project_name = Project.find(@email_arguments[:shared_project_id]).name
        @shared_project_id = @email_arguments[:shared_project_id]
      rescue => exception
        LogUtil.log_err_and_airbrake("reset_password_instructions with #{@email_arguments} failed")
        LogUtil.log_backtrace(exception)
      end
    else
      LogUtil.log_err_and_airbrake("Couldn't send reset_password_instructions to #{record.email} failed due to missing arguments")
    end
    super
  end

  private

  def assign_email_arguments(user)
    @email_arguments = user.email_arguments
  end
end
