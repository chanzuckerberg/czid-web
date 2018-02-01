class CustomDeviseMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: 'devise/mailer'

  def reset_password_instructions(record, token, opts = {})
    assign_email_template record
    opts[:template_name] = @template if @template
    opts[:subject] = @subject if @subject
    super
  end

  private

  def assign_email_template(user)
    @sharing_user_email = begin
                            User.find(user.email_arguments[:sharing_user_id]).email
                          rescue
                            nil
                          end
    @shared_project_name = begin
                             Project.find(user.email_arguments[:shared_project_id]).name
                           rescue
                             nil
                           end
    @template = begin
                  user.email_arguments[:email_template]
                rescue
                  nil
                end
    @subject = begin
                  user.email_arguments[:email_subject]
                rescue
                  nil
                end
  end
end
