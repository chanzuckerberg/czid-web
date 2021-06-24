# This script is for IDseq admins to use for manual cleanup of accounts that
# have never been logged-into.

task "delete_never_used_accounts", [:run_mode] => :environment do |_t, args|
  users = User.where(sign_in_count: 0).where("created_at < ?", 30.days.ago)

  if users.empty?
    raise "Nothing to delete! There are no accounts meeting the deletion criteria."
  end

  puts "=" * 80
  puts "THE FOLLOWING USER ACCOUNTS WILL BE PERMANENTLY DELETED"
  puts "=" * 80
  users.each do |u|
    puts "#{u.email.ljust(50)} #{u.name}"
  end

  # Do a sanity check:
  if Sample.where(user: users).present?
    raise "ERROR: The users to-be-deleted own Samples! This should not be possible " \
          "and indicates a problem with sign_in_count!"
  end

  unless args.run_mode == "noverify"
    puts "\nDo you want to proceed with deletion? Only 'yes' will be accepted to approve."
    input = STDIN.gets.strip
    if input != "yes"
      raise "User deletion aborted"
    end
  end

  puts "Starting deletions..."
  users.each do |u|
    puts "Deleting #{u.email} ..."

    # Delete user from Auth0
    Auth0UserManagementHelper.delete_auth0_user(email: u.email)

    u.destroy!
  end

  # DEBUGGING: If you run into Auth0 rate limits, just wait 30 seconds and try
  # again. Prod has a higher limit:
  # https://auth0.com/docs/policies/rate-limit-policy/management-api-endpoint-rate-limits

  puts "All done!"

  # NOTE: There should be no Samples or other activity associated with
  # never-used accounts, but remnant records (e.g. Snowflake copy) should be
  # eventually deleted. See:
  # https://czi.quip.com/MrPSAZDfq5nD/Protocol-to-Delete-All-User-Info
end
