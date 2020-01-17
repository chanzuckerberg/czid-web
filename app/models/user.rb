require 'elasticsearch/model'
require 'auth0'

class User < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
  end

  # https://api.rubyonrails.org/classes/ActiveRecord/SecureToken/ClassMethods.html#method-i-has_secure_token
  has_secure_token :authentication_token

  # NOTE: counter_cache is not supported for has_and_belongs_to_many.
  has_and_belongs_to_many :projects
  # All one-to-many assocs are counter cached for per-user analytics.
  # See traits_for_segment.
  has_many :samples, dependent: :destroy
  has_many :favorite_projects, dependent: :destroy
  has_many :favorites, through: :favorite_projects, source: :project, dependent: :destroy
  has_many :visualizations, dependent: :destroy
  has_many :phylo_trees, dependent: :destroy
  has_many :backgrounds, dependent: :destroy
  has_many :bulk_downloads, dependent: :destroy
  has_many :user_settings, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: {
    # Auth0 converts all emails to lowercase. Let's raise this at creation time
    # instead of automatically lower-casing.
    with: /\A(?~[A-Z])\z/, message: "may not contain capital letters",
  }
  validates :name, presence: true, format: {
    # See https://www.ascii-code.com/. These were the ranges that captured the
    # common accented chars I knew from experience, leaving out pure symbols.
    with: /\A[- 'a-zA-ZÀ-ÖØ-öø-ÿ]+\z/, message: "Name must contain only letters, apostrophes, dashes or spaces",
  }
  attr_accessor :email_arguments
  ROLE_REGULAR_USER = 0
  ROLE_ADMIN = 1
  IDSEQ_BUCKET_PREFIXES = ['idseq-'].freeze
  CZBIOHUB_BUCKET_PREFIXES = ['czb-', 'czbiohub-'].freeze

  def as_json(options = {})
    super({ except: [:authentication_token], methods: [:admin] }.merge(options))
  end

  def admin
    role == ROLE_ADMIN
  end

  def admin?
    admin
  end

  def role_name
    admin? ? 'admin user' : 'non-admin user'
  end

  def allowed_feature_list
    JSON.parse(allowed_features || "[]")
  end

  def allowed_feature?(feature)
    allowed_feature_list.include?(feature)
  end

  def add_allowed_feature(feature)
    parsed_allowed_features = allowed_feature_list

    unless parsed_allowed_features.include?(feature)
      update(allowed_features: parsed_allowed_features + [feature])
    end
  end

  def remove_allowed_feature(feature)
    parsed_allowed_features = allowed_feature_list

    if parsed_allowed_features.include?(feature)
      update(allowed_features: parsed_allowed_features - [feature])
    end
  end

  def can_upload(s3_path)
    return true if admin?

    user_bucket = s3_path.split("/")[2] # get "bucket" from "s3://bucket/path/to/file"

    # Don't allow any users to upload from idseq buckets
    return false if user_bucket.nil? || user_bucket == SAMPLES_BUCKET_NAME || IDSEQ_BUCKET_PREFIXES.any? { |prefix| user_bucket.downcase.starts_with?(prefix) }

    # Don't allow any non-Biohub users to upload from czbiohub buckets
    if CZBIOHUB_BUCKET_PREFIXES.any? { |prefix| user_bucket.downcase.starts_with?(prefix) }
      unless biohub_s3_upload_enabled?
        return false
      end
    end

    true
  end

  # This method is for tracking purposes only, not security.
  def biohub_user?
    ["czbiohub.org", "ucsf.edu"].include?(email.split("@").last)
  end

  def biohub_s3_upload_enabled?
    biohub_user? || allowed_feature_list.include?("biohub_s3_upload_enabled") || admin?
  end

  # This method is for tracking purposes only, not security.
  def czi_user?
    domain = email.split("@").last
    domain == "chanzuckerberg.com" || domain.ends_with?(".chanzuckerberg.com")
  end

  # "Greg  L.  Dingle" -> "Greg L."
  def first_name
    name.split[0..-2].join " "
  end

  # "Greg  L.  Dingle" -> "Dingle"
  def last_name
    name.split[-1]
  end

  def owns_project?(project_id)
    projects.exists?(project_id)
  end

  def get_user_setting(key)
    user_setting = user_settings.find_by(key: key)

    return user_setting.value unless user_setting.nil?

    return UserSetting::METADATA[key][:default]
  end

  def save_user_setting(key, value)
    user_setting = user_settings.find_or_initialize_by(key: key)

    user_setting.value = value
    user_setting.save!
  end

  # Remove any user settings gated on allowed_features that the user doesn't have access to due to allowed_feature flags.
  def viewable_user_setting_keys
    parsed_allowed_feature_list = allowed_feature_list
    UserSetting::METADATA.select do |_key, metadata|
      metadata[:required_allowed_feature].nil? || parsed_allowed_feature_list.include?(metadata[:required_allowed_feature])
    end.keys
  end

  # Get all viewable user settings, excluding any that are guarded on feature flags.
  def viewable_user_settings
    # Fetch viewable user settings.
    existing_user_settings = user_settings
                             .where(key: viewable_user_setting_keys)
                             .map { |setting| [setting.key, setting.value] }
                             .to_h

    # Fill in all missing user settings with the default value.
    viewable_user_setting_keys.each do |key|
      if existing_user_settings[key].nil?
        existing_user_settings[key] = UserSetting::METADATA[key][:default]
      end
    end

    existing_user_settings
  end

  # Update login trackable fields
  def update_tracked_fields!(request)
    # This method has been adapted from Devise trackable module to keep previous behavior (IDSEQ-1558 / IDSEQ-1720)
    # See: https://github.com/plataformatec/devise/blob/715192a7709a4c02127afb067e66230061b82cf2/lib/devise/models/trackable.rb#L20
    return if new_record?

    old_current = current_sign_in_at
    new_current = Time.now.utc
    self.last_sign_in_at     = old_current || new_current
    self.current_sign_in_at  = new_current

    old_current = current_sign_in_ip
    new_current = request.remote_ip
    self.last_sign_in_ip     = old_current || new_current
    self.current_sign_in_ip  = new_current

    self.sign_in_count ||= 0
    self.sign_in_count += 1
    save(validate: false)
  end

  # This returns a hash of interesting optional data for Segment user tracking.
  # Make sure you use any reserved names as intended by Segment!
  # See https://segment.com/docs/spec/identify/#traits .
  def traits_for_segment
    {
      # DB fields
      email: email,
      name: name,
      created_at: created_at,
      updated_at: updated_at,
      role: role,
      allowed_features: allowed_feature_list,
      institution: institution,
      # Derived fields
      admin: admin?,
      biohub_user: biohub_user?,
      czi_user: czi_user?,
      # Counts (should be cached in the users table for perf)
      projects: projects.size, # projects counter is NOT cached because has_and_belongs_to_many
      samples: samples.size,
      favorite_projects: favorite_projects.size,
      favorites: favorites.size,
      visualizations: visualizations.size,
      phylo_trees: phylo_trees.size,
      # Has-some (this is important for Google Custom Dimensions, which require
      # categorical values--there is no way to derive them from raw counts.) See
      # https://segment.com/docs/destinations/google-analytics/#custom-dimensions
      has_projects: !projects.empty?,
      has_samples: !samples.empty?,
      has_favorite_projects: !favorite_projects.empty?,
      has_favorites: !favorites.empty?,
      has_visualizations: !visualizations.empty?,
      has_phylo_trees: !phylo_trees.empty?,
      # Segment special fields
      createdAt: created_at.iso8601, # currently same as created_at
      firstName: first_name,
      lastName: last_name,
      # Login trackable fields (see User#update_tracked_fields!)
      sign_in_count: sign_in_count,
      current_sign_in_at: current_sign_in_at,
      last_sign_in_at: last_sign_in_at,
      current_sign_in_ip: current_sign_in_ip,
      last_sign_in_ip: last_sign_in_ip,
      # TODO: (gdingle): get more useful data on signup
      # title, phone, website, address, company
    }
  end
end
