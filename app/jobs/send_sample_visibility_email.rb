# LOGGING: This runs within resque. To find logs, go to ecs-log-{env} -> idseq-resque/idseq-resque/* log streams.

class SendSampleVisibilityEmail
  extend InstrumentedJob

  # Using ||= because app/jobs may be loaded at multiple points.
  NEXT_PERIOD ||= -> { Time.zone.today.next_month }
  NO_ELIGIBLE_SAMPLES ||= "No samples going public in the next period.".freeze
  NO_ELIGIBLE_USERS ||= "No eligible users have samples going public in the next period.".freeze
  SAMPLE_VISIBILITY_EMAIL_FEATURE ||= "sample_visibility_email".freeze

  @queue = :send_sample_visibility_email

  def self.perform
    Rails.logger.info("Starting SendSampleVisibilityEmail job...")

    samples = find_eligible_samples
    if samples.empty?
      Rails.logger.info(NO_ELIGIBLE_SAMPLES)
      return NO_ELIGIBLE_SAMPLES
    end
    samples_by_user_id = samples.group_by(&:user_id)

    users = find_eligible_users
    users = users.where(id: samples_by_user_id.keys)
    if users.empty?
      Rails.logger.info(NO_ELIGIBLE_USERS)
      return NO_ELIGIBLE_USERS
    end

    users.each do |user|
      individual_samples = samples_by_user_id[user.id]
      prepare_individual_emails(user, individual_samples)
    end

    Rails.logger.info("Finished SendSampleVisibilityEmail job.")
  end

  def self.find_eligible_samples
    time = NEXT_PERIOD.call
    range = [time.at_beginning_of_month, time.at_end_of_month]
    return Sample.samples_going_public_in_period(range)
  end

  def self.find_eligible_users
    launched = AppConfigHelper.get_json_app_config(AppConfig::LAUNCHED_FEATURES, [])
    users = if launched.include?(SAMPLE_VISIBILITY_EMAIL_FEATURE)
              User.all
            else
              # If the feature isn't launched, send to admins and beta users.
              User.where(role: User::ROLE_ADMIN).or(User.where("allowed_features like ?", "%#{SAMPLE_VISIBILITY_EMAIL_FEATURE}%"))
            end
    return users
  end

  def self.prepare_individual_emails(user, user_samples)
    period_name = NEXT_PERIOD.call.strftime("%B %Y")

    samples_by_project_id = user_samples.group_by(&:project_id)
    projects = Project.where(id: samples_by_project_id.keys)

    UserMailer.sample_visibility_reminder(
      email: user.email,
      name: user.name,
      period_name: period_name,
      projects: projects,
      samples_by_project_id: samples_by_project_id,
      total_count: user_samples.size
    ).deliver_now

    samples_by_project_id.each do |project_id, project_samples|
      # Example: "SendSampleVisibilityEmail: User 1 has samples [15225, 15226, 15227, 15216, 15218] going public in project 1 in March 2021."
      Rails.logger.info("SendSampleVisibilityEmail: User #{user.id} has samples #{project_samples.pluck(:id)} going public in project #{project_id} in #{period_name}.")
    end

    event = EventDictionary::SEND_SAMPLE_VISIBILITY_EMAIL_USER_EMAIL_SENT
    MetricUtil.log_analytics_event(event, user, {
                                     project_ids: samples_by_project_id.keys,
                                     sample_ids: user_samples.pluck(:id),
                                   })

    return samples_by_project_id
  end
end
