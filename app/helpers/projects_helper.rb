module ProjectsHelper
  def self.sanitize_project_name(user_input_text)
    # Allow letters, numbers, underscores, dashes, and spaces
    user_input_text.gsub(/[^A-Za-z0-9_\- ]/, '-')
  end

  def self.sanitize_project_description(user_input_text)
    # Remove HTML tags
    ActionController::Base.helpers.strip_tags(user_input_text)
  end
end
