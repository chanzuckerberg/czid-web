module Auth0UserManagementHelper
  AUTH0_CONNECTION_NAME = ENV["AUTH0_CONNECTION"] || "Username-Password-Authentication"

  # Create a new user in the Auth0 user database.
  # This method creates the user only in the main user database (Username-Password-Authentication)
  def self.create_auth0_user(email:, name:, role: User::ROLE_REGULAR_USER)
    options = {
      email: email,
      name: name,
      password: UsersHelper.generate_random_password,
      app_metadata: { roles: role == User::ROLE_ADMIN ? ['admin'] : [] },
    }
    # See:
    # - https://auth0.com/docs/api/management/v2#!/Users/post_users
    # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users.rb
    create_response = auth0_management_client.create_user(AUTH0_CONNECTION_NAME, options)
    if role == User::ROLE_ADMIN
      # We only need to add a role to this user if it is an admin
      change_auth0_user_role(auth0_user_id: create_response["user_id"], role: role)
    end
    create_response
  end

  # Delete users from Auth0 database based on the email.
  # This method will delete users that match this email in all auth0 connections
  def self.delete_auth0_user(email:)
    auth0_user_ids = get_auth0_user_ids_by_email(email)
    auth0_user_ids.each do |auth0_user_id|
      # See:
      # - https://auth0.com/docs/api/management/v2#!/Users/delete_users_by_id
      # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users.rb
      auth0_management_client.delete_user(auth0_user_id)
    end
  end

  # Get auth0 user ids based on the email
  # This method will fetch all auth0 connections (ex: idseq-legacy-users and Username-Password-Authentication) to retrieve these ids
  def self.get_auth0_user_ids_by_email(email)
    # See:
    # - https://auth0.com/docs/api/management/v2#!/Users_By_Email/get_users_by_email
    # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users_by_email.rb
    auth0_users = auth0_management_client.users_by_email(email, fields: "identities")
    (auth0_users.map { |u| u["identities"].map { |i| i.values_at("provider", "user_id").join("|") } }).flatten
  end

  # Get auth0 user ids and emails for users that:
  # - have not verified their email
  # - have not logged in
  # - were created 21 or more days ago
  # This method will fetch all auth0 connections (ex: idseq-legacy-users and Username-Password-Authentication) to retrieve these emails
  def self.unverified_auth0_users
    unverified_users_list = []

    # The get_users endpoint returns a maximum of 50 users. Use the `page` parameter to show more pages of results.
    # See: https://auth0.com/docs/manage-users/user-search/retrieve-users-with-get-users-endpoint
    page_num = 1
    while page_num != 0
      # See:
      # - https://auth0.com/docs/api/management/v2#!/Users/get_users
      # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users.rb
      unverified_users_query = "email_verified:false AND logins_count:0 AND created_at:[* TO #{(Time.now.utc - 21.days).iso8601}]"
      auth0_users = auth0_management_client.get_users(q: unverified_users_query, page: page_num, fields: "email,identities")
      unverified_users_list += auth0_users.map { |u| { email: u["email"], auth0_user_id: u["identities"].first["user_id"] } }

      max_results_per_page = 50
      if auth0_users.length < max_results_per_page
        # Stop fetching more pages
        page_num = 0
      else
        # Fetch next page
        page_num += 1
      end
    end
    unverified_users_list
  end

  private_class_method def self.change_auth0_user_role(auth0_user_id:, role: User::ROLE_REGULAR_USER)
    auth0_roles = auth0_management_client.get_roles
    auth0_admin_role = (auth0_roles.find { |r| r["name"] == "Admin" })["id"]
    if role == User::ROLE_ADMIN
      # See:
      # - https://auth0.com/docs/api/management/v2#!/Users/post_user_roles
      # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users.rb
      auth0_management_client.add_user_roles(auth0_user_id, [auth0_admin_role])
    else
      # See:
      # - https://auth0.com/docs/api/management/v2#!/Users/delete_user_roles
      # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users.rb
      auth0_management_client.remove_user_roles(auth0_user_id, [auth0_admin_role])
    end
  end

  # Patch user fields in Auth0 database.
  # This method will patch users that match this email in all auth0 connections
  def self.patch_auth0_user(old_email:, email:, name:, role:)
    auth0_user_ids = get_auth0_user_ids_by_email(old_email)
    if auth0_user_ids.empty?
      # Creates a user in auth0 if it is not already there (may have had a problem during legacy user migration)
      create_auth0_user(email: email, name: name, role: role)
    else
      auth0_user_ids.each do |auth0_user_id|
        body = { name: name, email: email, app_metadata: { roles: role == User::ROLE_ADMIN ? ['admin'] : [] } }
        # See:
        # - https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id
        # - https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/users.rb
        auth0_management_client.patch_user(auth0_user_id, body)
        change_auth0_user_role(auth0_user_id: auth0_user_id, role: role)
      end
    end
  end

  def self.get_auth0_password_reset_token(auth0_id)
    # See: https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/v2/tickets.rb
    auth0_management_client.post_password_change(user_id: auth0_id)
  end

  def self.send_auth0_password_reset_email(email)
    # Change with empty password triggers reset email.
    # See: https://github.com/auth0/ruby-auth0/blob/master/lib/auth0/api/authentication_endpoints.rb
    auth0_management_client.change_password(email, "", ENV["AUTH0_CONNECTION"])
  end

  # Set up Auth0 management client for actions like adding users.
  def self.auth0_management_client
    @auth0_management_client_cache ||= ActiveSupport::Cache::MemoryStore.new(expires_in: 1.hour)
    @auth0_management_client_cache.fetch('management_client', race_condition_ttl: 10.seconds) do
      # See: https://github.com/auth0/ruby-auth0/blob/master/README.md#management-api-v2
      Auth0Client.new(
        client_id: ENV["AUTH0_MANAGEMENT_CLIENT_ID"],
        client_secret: ENV["AUTH0_MANAGEMENT_CLIENT_SECRET"],
        domain: ENV["AUTH0_MANAGEMENT_DOMAIN"],
        api_version: 2
      )
    end
  end
end
