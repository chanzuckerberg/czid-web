class UserMailer < ApplicationMailer
  def added_to_projects_email(new_user_id, sharing_user_id, shared_project_id)
    @new_user_email = begin
                        User.find(new_user_id).email
                      rescue
                        nil
                      end
    @sharing_user_email = begin
                            User.find(sharing_user_id).email
                          rescue
                            nil
                          end
    @shared_project_name = begin
                             Proejct.find(shared_project_id).name
                           rescue
                             nil
                           end
    mail(to: @new_user_email, from: @sharing_user_email, subject: "New project on IDseq")
  end
end
