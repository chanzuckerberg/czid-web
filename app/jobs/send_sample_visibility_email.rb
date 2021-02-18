class SendSampleVisibilityEmail
  extend InstrumentedJob

  @queue = :send_sample_visibility_email

  def self.perform
    # TODO: Implement the action body.
    Rails.logger.info("SendSampleVisibilityEmail was called.")
  end
end
