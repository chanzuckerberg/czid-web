# Preview all emails at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
    def added_to_projects_email
        UserMailer.added_to_projects_email(User.second.id, {
            email_subject: 'You have been added to a project on IDseq',
            sharing_user_id: User.first.id,
            shared_project_id: Project.first.id 
        })
    end

    def new_user_new_project
        sender = User.second
        sender.email_arguments = {
            email_subject: 'You have been invited to IDseq',
            email_template: 'new_user_new_project',
            sharing_user_id: User.first.id,
            shared_project_id: Project.first.id 
        }
        CustomDeviseMailer.reset_password_instructions(sender, "fake_token", {})
    end

    def reset_password_instructions
        CustomDeviseMailer.reset_password_instructions(User.first, "fake_token", {})
    endg
end
