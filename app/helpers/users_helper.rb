module UsersHelper
  def self.generate_random_password
    # "aA1!" and 'squeeze' for no repeats to always satisfy complexity policy.
    (SecureRandom.base64(15) + "aA1!").squeeze
  end
end
