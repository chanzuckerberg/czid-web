class UserMailer < ApplicationMailer

  def added_to_projects_email_new_user(new_user, sharing_user, projects)
    @new_user = new_user
    @sharing_user = sharing_user
    @projects = projects
    mail(to: @new_user.email, from: @sharing_user.email, subject: "New project on IDseq")
  end
end
