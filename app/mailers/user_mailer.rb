class UserMailer < ApplicationMailer
  def added_to_projects_email(new_user_id, email_arguments)
    @new_user_email = begin
                        User.find(email_arguments[:new_user_id]).email
                      rescue
                        nil
                      end
    @sharing_user_email = begin
                            User.find(email_arguments[:sharing_user_id]).email
                          rescue
                            nil
                          end
    @shared_project_name = begin
                             Project.find(email_arguments[:shared_project_id]).name
                           rescue
                             nil
                           end
    mail(to: @new_user_email, from: @sharing_user_email, subject: email_arguments[:email_subject])
  end
end
