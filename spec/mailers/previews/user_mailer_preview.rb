# Preview all emails at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
  def added_to_projects_email
    UserMailer.added_to_projects_email(
      User.second.id,
      email_subject: 'You have been added to a project on CZ ID',
      sharing_user_id: User.first.id,
      shared_project_id: Project.first.id
    )
  end

  def account_request_reply
    UserMailer.account_request_reply(User.first.email)
  end
end
