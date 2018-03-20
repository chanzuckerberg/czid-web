class UserMailer < ApplicationMailer
  def added_to_projects_email(new_user_id, email_arguments)
    begin 
      @new_user_email = User.find(new_user_id).email
      @sharing_user_email = User.find(email_arguments[:sharing_user_id]).email
      @shared_project_name = Project.find(email_arguments[:shared_project_id]).name
      mail(to: @new_user_email, subject: email_arguments[:email_subject])
    rescue
    end
  end

  def project_complete_email(email_arguments)
    begin
      @project_name = email_arguments[:project_name]
      @project_id = email_arguments[:project_id]
      @number_samples = email_arguments[:number_samples]
      email_arguments[:user_emails].each do |user_email|
        mail(to: user_email, subject: "Project #{@project_name} has finished processing")
      end
    rescue
    end
  end
end
