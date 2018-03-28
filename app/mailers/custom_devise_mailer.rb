class CustomDeviseMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: 'devise/mailer'

  def reset_password_instructions(record, token, opts = {})
    assign_email_arguments record
    if @email_arguments
      begin
        opts[:template_name] = @email_arguments[:email_template] if @email_arguments[:email_template]
        opts[:subject] = @email_arguments[:email_subject] if @email_arguments[:email_subject]
        @sharing_user_email = User.find(@email_arguments[:sharing_user_id]).email
        @shared_project_name = Project.find(@email_arguments[:shared_project_id]).name
        @shared_project_id = @email_arguments[:shared_project_id]
      rescue
        Airbrake.notify("reset_password_instructions with #{@email_arguments} failed")
      end
    end
    super
  end

  private

  def assign_email_arguments(user)
    @email_arguments = user.email_arguments
  end
end
