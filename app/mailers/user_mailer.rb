class UserMailer < ApplicationMailer
  def added_to_projects_email(new_user_id, email_arguments)
    @new_user_email = User.find(new_user_id).email
    @sharing_user_email = User.find(email_arguments[:sharing_user_id]).email
    @shared_project_name = Project.find(email_arguments[:shared_project_id]).name
    @shared_project_id = email_arguments[:shared_project_id]
    mail(to: @new_user_email, subject: email_arguments[:email_subject])
  rescue
    Airbrake.notify("added_to_projects_email(#{email_arguments}) failed")
  end
end
