require 'elasticsearch/model'

class User < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
  end
  acts_as_token_authenticatable
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable, :registerable
  devise :database_authenticatable, :recoverable,
         :rememberable, :trackable, :validatable

  has_and_belongs_to_many :projects
  # All one-to-many assocs are counter cached for per-user analytics.
  # See traits_for_segment.
  has_many :samples
  has_many :favorite_projects
  has_many :favorites, through: :favorite_projects, source: :project
  has_many :visualizations
  has_many :phylo_trees

  validates :email, presence: true
  validates :name, presence: true, format: { with: /\A[a-zA-Z -]+\z/, message: "only allows letters" }
  attr_accessor :email_arguments
  ROLE_ADMIN = 1
  DEMO_USER_EMAILS = ['idseq.guest@chanzuckerberg.com'].freeze
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

  def allowed_feature_list
    JSON.parse(allowed_features || "[]")
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

  def demo_user?
    DEMO_USER_EMAILS.include?(email)
  end

  def can_upload(s3_path)
    return true if admin?

    user_bucket = s3_path.split("/")[2] # get "bucket" from "s3://bucket/path/to/file"

    # Don't allow any users to upload from idseq buckets
    return false if user_bucket == SAMPLES_BUCKET_NAME || IDSEQ_BUCKET_PREFIXES.any? { |prefix| user_bucket.downcase.starts_with?(prefix) }

    # Don't allow any non-Biohub users to upload from czbiohub buckets
    if CZBIOHUB_BUCKET_PREFIXES.any? { |prefix| user_bucket.downcase.starts_with?(prefix) }
      unless biohub_user?
        return false
      end
    end

    true
  end

  def biohub_user?
    ["czbiohub.org", "ucsf.edu"].include?(email.split("@").last)
  end

  def czi_user?
    ["chanzuckerberg.com"].include?(email.split("@").last)
  end

  # "Greg  L.  Dingle" -> "Greg L."
  def first_name
    name.split[0..-2].join " "
  end

  # "Greg  L.  Dingle" -> "Dingle"
  def last_name
    name.split[-1]
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
      demo_user: demo_user?,
      biohub_user: biohub_user?,
      czi_user: czi_user?,
      # Counts (should be cached in the users table for perf)
      projects: projects.size, # projects counter is NOT cached because has_and_belongs_to_many
      samples: samples.size,
      favorite_projects: favorite_projects.size,
      favorites: favorites.size,
      visualizations: visualizations.size,
      phylo_trees: phylo_trees.size,
      # Has-some (this is important for Google Custom Dimensions)
      # See https://segment.com/docs/destinations/google-analytics/#custom-dimensions
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
      # Devise fields
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
