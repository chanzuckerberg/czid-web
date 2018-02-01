class UserMailer < ApplicationMailer
  def added_to_projects_email(new_user_id, sharing_user_id, shared_project_id)
    @new_user_email = User.find(new_user_id).email rescue nil
    @sharing_user_email = User.find(sharing_user_id).email rescue nil
    @shared_project_name = Proejct.find(shared_project_id).name rescue nil
    mail(to: @new_user_email, from: @sharing_user_email, subject: "New project on IDseq")
  end
end
