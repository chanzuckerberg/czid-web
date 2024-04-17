# Standard resources example:
# HTTP Verb   Path              Controller#Action
# GET         /photos           photos#index
# GET         /photos/new       photos#new
# POST        /photos           photos#create
# GET         /photos/:id       photos#show
# GET         /photos/:id/edit  photos#edit
# PATCH/PUT   /photos/:id       photos#update
# DELETE      /photos/:id       photos#destroy
#
# If you follow this convention, DON'T add new paths such as /photos/index.json
# or /photos/create.json (use GET /photos.json and POST /photos.json).

Rails.application.routes.draw do
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end
  post "/graphql", to: "graphql#execute"
  # It's unclear what it would mean to update a background, so we disallow.
  resources :backgrounds, except: [:edit, :update] do
    get :show_taxon_dist, on: :member
  end

  get 'auth/auth0/callback/' => 'auth0#callback'
  get 'auth/failure/' => 'auth0#failure'
  namespace :auth0 do
    post :request_password_reset
    get :refresh_token
    get :background_refresh
    match :login, via: [:get, :post]
    match :logout, via: [:get, :post]
    post :logout
    get :failure
  end
  get 'users/password/new' => 'users#password_new'
  get 'users/register', to: 'users#register'

  get "identify", to: "identity#identify"
  get "enrich_token", to: "identity#enrich_token"
  get "impersonate", to: "identity#impersonate"
  get "enrich_token_for_admin", to: "identity#enrich_token_for_admin"

  resources :samples do
    member do
      get :pipeline_runs
      get :report_v2
      get :amr
      get :report_csv
      get :nonhost_fasta
      get :unidentified_fasta
      get :contigs_fasta
      get :contigs_fasta_by_byteranges
      get :contigs_sequences_by_byteranges
      get :contigs_summary
      get :results_folder
      get :raw_results_folder
      get :upload_credentials
      get :metadata
      get :taxid_contigs_download
      get :taxid_contigs_for_blast
      get :taxon_five_longest_reads
      get :coverage_viz_summary
      get :coverage_viz_data
      get :pipeline_logs

      put :reupload_source
      put :kickoff_pipeline
      put :cancel_pipeline_run

      post :save_metadata
      post :save_metadata_v2
      post :kickoff_workflow
    end

    collection do
      get :all
      get :bulk_import
      get :upload
      post :metadata_fields
      get :index_v2
      get :details
      get :dimensions
      get :reads_stats
      get :stats
      get :benchmark_ground_truth_files

      post :validate_sample_files
      post :enable_mass_normalized_backgrounds
      post :bulk_upload_with_metadata
      post :bulk_upload
      post :validate_sample_ids
      post :taxa_with_reads_suggestions
      post :taxa_with_contigs_suggestions
      post :uploaded_by_current_user
      post :bulk_kickoff_workflow_runs
      post :user_is_collaborator
      post :validate_user_can_delete_objects
      post :bulk_delete
      post :benchmark
    end
  end

  get 'samples/:id/fasta/:tax_level/:taxid/:hit_type', to: 'samples#show_taxid_fasta'
  get 'samples/:id/alignment_viz/:taxon_info', to: 'samples#show_taxid_alignment_viz'
  get 'samples/heatmap', to: redirect(path: "visualizations/heatmap", status: 301)

  get 'cli_user_instructions', to: 'samples#cli_user_instructions'

  # HomeController:
  get 'all_data', to: 'home#all_data'
  get 'home', to: 'home#index'
  get 'maintenance', to: 'home#maintenance'
  get 'my_data', to: 'home#my_data'
  get 'page_not_found', to: 'home#page_not_found'
  get 'public', to: 'home#public'
  get 'select', to: 'home#index'
  get 'taxon_descriptions', to: 'home#taxon_descriptions'
  get 'admin/admin_settings', to: 'home#admin_settings'
  get 'admin/projects/:projectId', to: 'home#admin_projects'
  get 'admin/samples/:sampleId', to: 'home#admin_samples'
  get 'admin', to: 'home#admin'
  get 'app_configs', to: 'home#app_configs'
  get 'user_profile_form', to: 'home#user_profile_form'
  put 'workflow_version', to: 'home#set_workflow_version'
  put 'set_app_config', to: 'home#set_app_config'
  post 'feedback', to: 'home#feedback'
  post 'sign_up', to: 'home#sign_up'

  # SupportController:
  get 'faqs', to: 'support#faqs'
  get 'privacy_notice_for_user_research', to: "support#privacy_notice_for_user_research"
  get 'impact', to: "support#impact"
  get 'privacy', to: 'support#privacy'
  get 'terms_changes', to: 'support#terms_changes'
  get 'terms', to: 'support#terms'
  get 'privacy_preview', to: 'support#privacy_preview'
  get 'terms_preview', to: 'support#terms_preview'
  get 'security_white_paper', to: 'support#security_white_paper'

  resources :projects do
    member do
      get :all_users
      get :validate_project_name

      put :update_project_visibility
      put :add_user
      put :update

      post :validate_metadata_csv
      post :upload_metadata
      post :validate_sample_names
    end

    collection do
      get :metadata_fields
      get :dimensions
    end
  end

  get 'projects/:id/csv', to: 'projects#send_project_csv'
  get 'projects/:id/pipeline_versions', to: 'projects#project_pipeline_versions'
  get 'choose_project', to: 'projects#choose_project'

  get 'phylo_trees/index', to: 'phylo_trees#index'
  get 'phylo_trees/:id/show', to: 'phylo_trees#show'
  get 'phylo_trees/new', to: 'phylo_trees#new'
  post 'phylo_trees/create', to: 'phylo_trees#create'
  post 'phylo_trees/retry', to: 'phylo_trees#retry'
  get 'phylo_trees/:id/download', to: 'phylo_trees#download'
  get 'choose_taxon', to: 'phylo_trees#choose_taxon'
  get 'search_suggestions', to: 'samples#search_suggestions'
  get 'phylo_trees/validate_name', to: 'phylo_trees#validate_name'

  get 'visualizations/samples_taxons.json', to: 'visualizations#samples_taxons'
  post 'visualizations/taxa_details.json', to: 'visualizations#taxa_details'
  get 'visualizations/pathogen_flags', to: 'visualizations#pathogen_flags'
  get 'visualizations/heatmap_metrics.json', to: 'visualizations#heatmap_metrics'
  get 'visualizations/download_heatmap', to: 'visualizations#download_heatmap'
  post 'visualizations/:type/save', to: 'visualizations#save'
  get 'visualizations/:type(/:id)', to: 'visualizations#visualization'
  post 'visualizations/shorten_url', to: 'visualizations#shorten_url'
  get 'visualizations.json', to: 'visualizations#index'
  put 'visualizations/:id', to: 'visualizations#update'

  get 'amr_heatmap/amr_counts.json', to: 'amr_heatmap#amr_counts'
  get 'amr_ontology/fetch_ontology.json', to: 'amr_ontology#fetch_ontology'
  get 'amr_heatmap', to: 'amr_heatmap#index'

  get 'basespace/oauth', to: 'basespace#oauth'
  get 'basespace/projects', to: 'basespace#projects'
  get 'basespace/samples_for_project', to: 'basespace#samples_for_project'

  get 'samples/:sample_id/pipeline_viz(/:pipeline_version)', to: 'pipeline_viz#show',
                                                             constraints: { pipeline_version: /\d+\.\d+/ } # To allow period in pipeline version parameter

  resources :bulk_downloads, only: [:create, :index, :show] do
    member do
      get :presigned_output_url
    end

    collection do
      post :consensus_genome_overview_data
      post :consensus_genome_sample_metadata
      post :sample_metadata
      get :types
      get :metrics
    end
  end

  post 'bulk_downloads/:id/success/:access_token', to: 'bulk_downloads#success_with_token', as: :bulk_downloads_success
  post 'bulk_downloads/:id/error/:access_token', to: 'bulk_downloads#error_with_token', as: :bulk_downloads_error
  post 'bulk_downloads/:id/progress/:access_token', to: 'bulk_downloads#progress_with_token', as: :bulk_downloads_progress

  get 'user_settings/metadata_by_category', to: 'user_settings#metadata_by_category'
  post 'user_settings/update', to: 'user_settings#update'
  get 'user_settings', to: 'user_settings#index'

  get 'sample_types.json', to: 'sample_types#index'

  # Routes related to SnapshotLink sharing
  get 'pub/:share_id/samples/stats.json', to: 'snapshot_samples#stats'
  get 'pub/:share_id/samples/dimensions.json', to: 'snapshot_samples#dimensions'
  get 'pub/:share_id/samples/index_v2.json', to: 'snapshot_samples#index_v2'
  post 'pub/:share_id/samples/metadata_fields', to: 'snapshot_samples#metadata_fields'
  get 'pub/:share_id/samples/:id', to: 'snapshot_samples#show'
  get 'pub/:share_id/samples/:id/report_v2', to: 'snapshot_samples#report_v2'
  get 'pub/:share_id/samples/:id/metadata', to: 'snapshot_samples#metadata'
  delete 'pub/:share_id/destroy', to: 'snapshot_links#destroy'
  post 'pub/projects/:project_id/create', to: 'snapshot_links#create'
  get 'pub/projects/:project_id/info.json', to: 'snapshot_links#info'
  get 'pub/:share_id/backgrounds', to: 'snapshot_samples#backgrounds'
  get 'pub/:share_id', to: 'snapshot_links#show'
  put 'pub/:share_id/update_background', to: 'snapshot_links#update_background'
  get 'pub/:share_id/samples/:id/coverage_viz_summary', to: 'snapshot_samples#coverage_viz_summary'
  get 'pub/:share_id/samples/:id/coverage_viz_data', to: 'snapshot_samples#coverage_viz_data'

  get 'pathogen_list(/:version)', to: 'pathogen_lists#show'

  resources :annotations, only: :create

  resources :frontend_metrics, only: :create

  resources :host_genomes do
    collection do
      get :index_public
    end
  end

  resources :persisted_backgrounds, only: [:index, :create]
  resources :persisted_backgrounds, only: [:update, :show], param: :projectId

  resources :users, only: [:create, :edit, :update, :destroy, :index] do
    collection do
      get :feature_flags
      post :feature_flag
    end

    member do
      post :update_user_data
      post :post_user_data_to_airtable
    end
  end

  resources :benchmarks, only: [:index]

  namespace :playground do
    get :controls
    get :components
    get :icons
    get :typography
    get :viz
  end

  resource :metadata do
    collection do
      get :dictionary
      get :official_metadata_fields
      get :metadata_template_csv
      get :instructions
      get :metadata_for_host_genome

      post :validate_csv_for_new_samples
      post :metadata_template_csv
    end
  end

  resource :locations do
    collection do
      get :external_search
      get :map_playground
      get :sample_locations
    end
  end

  resources :workflow_runs, only: [:index, :show] do
    member do
      get :results
      get :zip_link
      get :amr_report_downloads
      get :amr_gene_level_downloads
      get :benchmark_report_downloads
      get :cg_report_downloads

      put :rerun
    end

    collection do
      post :validate_workflow_run_ids
      post :created_by_current_user
      post :valid_consensus_genome_workflow_runs
      post :consensus_genome_clade_export
      post :workflow_runs_info
      post :metadata_fields
    end
  end

  resources :phylo_tree_ngs, only: [:create, :index, :show] do
    member do
      get :download
      put :rerun
    end

    collection do
      get :new_pr_ids
      get :new_pr_info
      get :choose_taxon
      get :validate_name
    end
  end

  authenticate :auth0_user, ->(u) { u.admin? } do
    mount RESQUE_SERVER, at: "/resque"
  end

  # See health_check gem
  get 'health_check' => "health_check/health_check#index"

  # No default favicon.ico
  get '/favicon.ico', to: proc { [404, {}, ['']] }

  # Un-shorten URLs. This should go second-to-last.
  get '/:id' => "shortener/shortened_urls#show"

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#landing'
end

Rails.application.routes.named_routes.url_helpers_module.module_eval do
  def new_user_session_url
    url_for(new_user_session_path)
  end

  def new_user_session_path
    url_for(controller: :auth0, action: :login, only_path: true)
  end

  def destroy_user_session_path
    url_for(controller: :auth0, action: :logout, only_path: true)
  end
end
