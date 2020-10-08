class UserMailer < ApplicationMailer
  # See: app/views/user_mailer/added_to_projects_email.html.erb.
  def added_to_projects_email(new_user_id, email_arguments)
    @new_user_email = User.find(new_user_id).email
    @sharing_user = User.find(email_arguments[:sharing_user_id])
    @shared_project_name = Project.find(email_arguments[:shared_project_id]).name
    @shared_project_id = email_arguments[:shared_project_id]
    mail(to: @new_user_email, subject: email_arguments[:email_subject])
  rescue StandardError
    LogUtil.log_err("added_to_projects_email(#{email_arguments}) failed")
  end

  def landing_sign_up_email(body)
    account_email = "accounts@idseq.net"
    mail(to: account_email, subject: "New sign up from landing page", body: body)
  end

  # See: app/views/user_mailer/account_request_reply.html.erb.
  def account_request_reply(request_email)
    mail(
      to: request_email,
      subject: "Thank you for contacting the IDseq Team"
    )
  end

  # See: app/views/user_mailer/new_auth0_user_new_project.html.erb.
  def new_auth0_user_new_project(sharing_user, new_user_email, shared_project_id, reset_password_url)
    @reset_password_url = reset_password_url
    @shared_project_id = shared_project_id
    @shared_project_name = Project.find(shared_project_id).name
    @sharing_user_email = sharing_user.email
    @sharing_user_name = sharing_user.name
    mail(
      to: new_user_email,
      subject: "You have been invited to IDseq"
    )
  end

  # See: app/views/user_mailer/account_activation.html.erb.
  def account_activation(new_user_email, reset_password_url)
    @reset_password_url = reset_password_url
    mail(
      to: new_user_email,
      subject: "You have been invited to IDseq"
    )
  end

  # See: app/views/user_mailer/no_account_found.html.erb.
  def no_account_found(email)
    mail(
      to: email,
      subject: "IDseq | Could not locate an account with this email"
    )
  end
end
