# frozen_string_literal: true

desc 'Export legacy users to Auth0'

task 'export_users_to_auth0' => :environment do |_t, _args|
  ActiveRecord::Base.logger.level = :info

  options = { emails: [], export_all: false }

  op = OptionParser.new do |o|
    o.banner = "Usage: rake export_users_to_auth0 -- (--emails=<EMAILS> | --all)"
    o.on("--emails=<EMAILS>", "Comma separated list with the emails of the users to be exported") do |emails|
      options[:emails] = emails.split(',').map(&:strip)
    end
    o.on("--all", "Export all users from the database.") do
      options[:export_all] = true
    end
  end
  args = op.order(ARGV) {}
  op.parse!(args)

  if options[:emails].empty? && !options[:export_all]
    puts 'ERROR: no users have been provided'
    op.parse!(%w[--help])
    exit 2
  elsif options[:export_all] && !options[:emails].empty?
    puts 'ERROR: You cannot use --email and --all at the same time'
    op.parse!(%w[--help])
    exit 2
  end

  eua = ExportUsersAuth0.new(
    ENV['AUTH0_DOMAIN'],
    ENV['AUTH0_API_BEARER_TOKEN']
  )

  if options[:export_all]
    eua.export_all_users
  else
    eua.export_users(options[:emails])
  end
end

class ExportUsersAuth0
  attr_reader :auth0_domain, :auth0_api_bearer_token
  AUTH0_DB_CONNECTION_NAME = "idseq-legacy-users"

  def initialize(auth0_domain, auth0_api_bearer_token)
    @auth0_domain = auth0_domain
    @auth0_api_bearer_token = auth0_api_bearer_token
  end

  def export_all_users
    users = User.all
    users.map(&method(:export_user))
  end

  def export_users(emails)
    users = User.where(email: emails)
    users.map(&method(:export_user))
  end

  private def export_user(user)
    email = user.email
    legacy_user_record = format_legacy_user_record(user)
    puts ">>> Exporting user #{email} <<<"
    result = auth0_api_create_user(legacy_user_record)

    if result['error'] && result['response'].fetch_values('statusCode', 'error') == [409, 'Conflict']
      puts "= user already exists, updating user info"
      result = auth0_api_update_user(legacy_user_record)
    end

    if result['error']
      puts "!!! ERROR exporting user: #{result['response']}"
    else
      puts "+ OK"
    end

    puts

    result
  end

  private def auth0_api_create_user(legacy_user_record)
    json_response = HTTP.auth("Bearer #{@auth0_api_bearer_token}")
                        .post(
                          "https://#{@auth0_domain}/api/v2/users",
                          json: legacy_user_record
                        )
    response = JSON.parse(json_response)
    {
      'created' => response["created_at"].present?,
      'updated' => false,
      'error' => response["error"].present?,
      'response' => response.to_h,
    }
  end

  private def auth0_api_update_user(legacy_user_record)
    user_id = "auth0|#{legacy_user_record['user_id']}"

    update_record = legacy_user_record.reject { |k| ['user_id', 'email_verified', 'verify_email', 'email'].include?(k) }

    json_response = HTTP.auth("Bearer #{@auth0_api_bearer_token}")
                        .patch(
                          "https://#{@auth0_domain}/api/v2/users/#{user_id}",
                          json: update_record
                        )
    response = JSON.parse(json_response)
    {
      'created' => false,
      'updated' => response["created_at"].present?,
      'error' => response["error"].present?,
      'response' => response.to_h,
    }
  end

  private def format_legacy_user_record(user)
    {
      'connection' => AUTH0_DB_CONNECTION_NAME,
      'email' => "legacy_idseq|#{user.email}",
      'email_verified' => true,
      'app_metadata' => {
        'roles' => user.role == 1 ? ['admin'] : [],
        'legacy_password_hash' => user.encrypted_password,
        'idseq_user_id' => user.id,
        'user_email' => user.email,
      },
      'name' => user.name,
      'user_id' => "legacy_idseq|#{user.email}",
      'user_metadata' => {},
      'password' =>  user.encrypted_password,
      'verify_email' => false,
    }.freeze
  end
end
