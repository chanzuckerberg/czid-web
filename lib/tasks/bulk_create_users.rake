desc 'Bulk create users'

# Expected new user info input should follow the format:
# [
#   {
#     "email" : "joe@czi.com"         # required
#     "name": "joe",                  # required
#     "institution": "CZI",           # required
#     "send_activation": true         # required
#     "archetypes": [                 # optional
#       "Medical Detective",
#       "Landscape Explorer",
#       "Outbreak Surveyor",
#       "Microbiome Investigator"
#     ],
#     "group": [                      # optional
#       "Africa CDC",
#       "Biohub",
#       "DPH",
#       "GCE",
#       "LMIC"
#     ],
#   }
# ]

# NOTE: ROLE parameter will be default to 0 (regular user), unless script is modified to give admin privileges.

# To run rake task from a rails console:
#   1. Rails.application.load_tasks
#   2. Create a new_users_info array
#   3. Rake::Task['bulk_create_users'].invoke(new_users_info, yourUserIdHere)

task 'bulk_create_users', [:new_users_info, :current_user_id] => :environment do |_t, args|
  args[:new_users_info].each do |user_info|
    new_user_params = user_info.to_h.symbolize_keys
    new_user_params[:role] = 0
    send_activation = new_user_params.delete(:send_activation)

    begin
      UserFactoryService.call(
        current_user: User.find(args[:current_user_id]),
        send_activation: send_activation,
        **new_user_params
      )
      puts "User #{new_user.id} was created successfully"
    rescue Net::SMTPAuthenticationError => e
      puts "SMTP Authentication is failing with #{e.message}"
      Auth0UserManagementHelper.send_auth0_password_reset_email(email)
    end
  end
end
