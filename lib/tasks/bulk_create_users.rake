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

# Note: ROLE parameter will be default to 0 (regular user), unless script is modified to give admin privelages.

# To run rake task:
#   1. Rails.application.load_tasks
#   2. Create a new_users_info array
#   3. Rake::Task['bulk_create_users'].invoke(new_users_info, yourUserIdHere)

task 'bulk_create_users', [:new_users_info, :current_user_id] => :environment do |_t, args|
  args[:new_users_info].each do |user_info|
    new_user_params = user_info.to_h.symbolize_keys
    new_user_params[:role] = 0
    new_user_params[:email].downcase!
    send_activation = new_user_params.delete(:send_activation)

    new_user = User.new(**new_user_params, created_by_user_id: args[:current_user_id])

    if new_user.save!
      # Create the user with Auth0.
      create_response = Auth0UserManagementHelper.create_auth0_user(**new_user_params.slice(:email, :name, :role))

      if send_activation
        # Get their password reset link so they can set a password.
        auth0_id = create_response["user_id"]
        reset_response = Auth0UserManagementHelper.get_auth0_password_reset_token(auth0_id)
        reset_url = reset_response["ticket"]

        # Send them an invitation and account activation email.
        email = new_user_params[:email]
        begin
          UserMailer.account_activation(email, reset_url).deliver_now
          puts "User #{new_user.id} was created successfully"
        rescue Net::SMTPAuthenticationError => e
          puts "SMTP Authentication is failing with #{e.message}"
          Auth0UserManagementHelper.send_auth0_password_reset_email(email)
        end
      end
    end
  end
end
