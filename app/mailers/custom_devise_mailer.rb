class MyMailer < Devise::Mailer   
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: 'devise/mailer'

  def new_user_new_project_email(new_user, sharing_user, project)
    @new_user = new_user
    @sharing_user = sharing_user
    @project = project
    mail(to: @new_user.email, from: @sharing_user.email, subject: "New project on IDseq")
  end
end
