# Queries Auth0 and deletes user accounts that:
# - are unclaimed (a.k.a. have not verified their email and have not signed in)
# - were created 21 or more days ago
# If any deletions fail, a Sentry error will be logged for on-call intervention.
# Note that accounts that have not been claimed within 30 days MUST NOT be retained.
class DeleteUnclaimedUserAccounts < StandardError
  extend InstrumentedJob

  @queue = :delete_unclaimed_user_accounts

  class DeleteUnclaimedUserAccountsError < StandardError
    def initialize
      super("Error deleting unclaimed user account.")
    end
  end

  def self.perform
    Rails.logger.info("Checking for unclaimed user accounts...")
    unclaimed_accounts = query_auth0_for_unclaimed_user_accounts
    if unclaimed_accounts.empty?
      # Log in ops-notifs channel for visibility
      LogUtil.log_message("Nothing to delete! There are no accounts meeting the deletion criteria.")
    else
      # Log in ops-notifs channel for visibility
      LogUtil.log_message("Found #{unclaimed_accounts.length} unclaimed user accounts in Auth0")

      deletion_mode_enabled = AppConfigHelper.get_app_config(AppConfig::ENABLE_DELETE_UNCLAIMED_USER_ACCOUNTS) == "1"
      if deletion_mode_enabled
        Rails.logger.info("Starting to delete unclaimed user accounts...")
        delete_unclaimed_accounts(unclaimed_accounts)
        Rails.logger.info("Finished deleting unclaimed user accounts")
      end
    end
  rescue StandardError => e
    LogUtil.log_error(
      "Unexpected error encountered while deleting unclaimed user accounts",
      exception: e
    )
    raise e
  end

  def self.query_auth0_for_unclaimed_user_accounts
    Auth0UserManagementHelper.unverified_auth0_users
  rescue StandardError => e
    LogUtil.log_error(
      "Failed to retrieve unclaimed user accounts from Auth0",
      exception: e
    )
    []
  end

  def self.delete_unclaimed_accounts(unclaimed_accounts)
    unclaimed_accounts.each_with_index do |account, index|
      Rails.logger.info("Deleting unclaimed account #{index}/#{unclaimed_accounts.length}...")

      user = User.find_by(email: account[:email])
      days_since_creation = nil
      if user.present?
        days_since_creation = ((Time.now.utc - user.created_at) / 1.day).round

        # 1. Sanity-check that user owns no samples
        if Sample.where(user: user).present?
          LogUtil.log_error(
            "ERROR: The user to-be-deleted owns samples",
            exception: DeleteUnclaimedUserAccountsError.new,
            user_id: user.id
          )
          next # skip deleting this user from Auth0 and MySQL
        end
      end

      # 2. Delete user from Auth0
      begin
        Auth0UserManagementHelper.delete_auth0_user(email: account[:email])
      rescue StandardError => e
        # This account will be processed in future runs of this job.
        LogUtil.log_error(
          "Failed to delete account from Auth0. Retrying tomorrow. Warning: unclaimed accounts must be deleted within 30 days of creation.",
          exception: e,
          auth0_user_id: account[:auth0_user_id],
          days_since_creation: days_since_creation
        )
        next # skip deleting this user from MySQL
      end

      # 3. Delete user from MySQL
      if user.present?
        begin
          user.destroy!
        rescue StandardError => e
          # This account WILL NOT be processed in future runs of this job.
          LogUtil.log_error(
            "Failed to delete account from MySQL. Manual action required: this account must be deleted from MySQL within 30 days of creation.",
            exception: e,
            user_id: user.id,
            days_since_creation: days_since_creation
          )
        end
      end
    end
  end
end
