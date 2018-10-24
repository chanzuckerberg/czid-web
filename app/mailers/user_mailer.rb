class UserMailer < ApplicationMailer
  def added_to_projects_email(new_user_id, email_arguments)
    @new_user_email = User.find(new_user_id).email
    @sharing_user = User.find(email_arguments[:sharing_user_id])
    @shared_project_name = Project.find(email_arguments[:shared_project_id]).name
    @shared_project_id = email_arguments[:shared_project_id]
    mail(to: @new_user_email, subject: email_arguments[:email_subject])
  rescue
    LogUtil.log_err_and_airbrake("added_to_projects_email(#{email_arguments}) failed")
  end

  def project_complete_email(email_arguments)
    @project_name = email_arguments[:project_name]
    @project_id = email_arguments[:project_id]
    @number_samples = email_arguments[:number_samples]
    mail(to: email_arguments[:user_email], subject: "Project '#{@project_name}' has finished processing")
  rescue
    LogUtil.log_err_and_airbrake("project_complete_email(#{email_arguments}) failed")
  end

  def landing_sign_up_email(body)
    account_email = "accounts@idseq.net"
    mail(to: account_email, subject: "New sign up from landing page", body: body)
  end
end
