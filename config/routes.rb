Rails.application.routes.draw do
  resources :backgrounds do
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

  resources :samples do
    put :reupload_source, on: :member
    put :kickoff_pipeline, on: :member
    put :retry_pipeline, on: :member
    get :all, on: :collection
    get :pipeline_runs, on: :member
    get :report_v2, on: :member
    get :amr, on: :member
    get :report_csv, on: :member
    get :bulk_import, on: :collection
    get :upload, on: :collection
    get :nonhost_fasta, on: :member
    get :unidentified_fasta, on: :member
    get :contigs_fasta, on: :member
    get :contigs_fasta_by_byteranges, on: :member
    get :contigs_sequences_by_byteranges, on: :member
    get :contigs_summary, on: :member
    get :results_folder, on: :member
    get :raw_results_folder, on: :member
    post :bulk_upload, on: :collection
    post :bulk_upload_with_metadata, on: :collection
    get :upload_credentials, on: :member
    get :metadata, on: :member
    get :metadata_fields, on: :collection
    get :contig_taxid_list, on: :member
    get :taxid_contigs, on: :member
    get :summary_contig_counts, on: :member
    get :samples_going_public, on: :collection
    get :index_v2, on: :collection
    get :details, on: :collection
    post :enable_mass_normalized_backgrounds, on: :collection
    get :dimensions, on: :collection
    get :stats, on: :collection
    post :save_metadata, on: :member
    post :save_metadata_v2, on: :member
    post :validate_sample_files, on: :collection
    post :validate_sample_ids, on: :collection
    get :coverage_viz_summary, on: :member
    get :coverage_viz_data, on: :member
    post :taxa_with_reads_suggestions, on: :collection
    post :taxa_with_contigs_suggestions, on: :collection
    post :uploaded_by_current_user, on: :collection
    get :reads_stats, on: :collection
    post :consensus_genome_clade_export, on: :collection
    post :kickoff_workflow, on: :member
  end

  get 'samples/:id/fasta/:tax_level/:taxid/:hit_type', to: 'samples#show_taxid_fasta'
  get 'samples/:id/alignment_viz/:taxon_info', to: 'samples#show_taxid_alignment_viz'
  get 'samples/heatmap', to: redirect(path: "visualizations/heatmap", status: 301)

  get 'cli_user_instructions', to: 'samples#cli_user_instructions'
  get 'select', to: 'home#index'
  get 'home', to: 'home#index'
  get 'taxon_descriptions', to: 'home#taxon_descriptions'
  get 'public', to: 'home#public'
  get 'my_data', to: 'home#my_data'
  get 'all_data', to: 'home#all_data'
  post 'feedback', to: 'home#feedback'
  post 'sign_up', to: 'home#sign_up'
  get 'privacy', to: 'support#privacy'
  get 'terms', to: 'support#terms'
  get 'terms_changes', to: 'support#terms_changes'
  get 'faqs', to: 'support#faqs'
  get 'page_not_found', to: 'home#page_not_found'

  get 'maintenance', to: 'home#maintenance'

  resources :projects do
    get :make_project_reports_csv, on: :member
    get :project_reports_csv_status, on: :member
    get :send_project_reports_csv, on: :member
    get :make_host_gene_counts, on: :member
    get :host_gene_counts_status, on: :member
    get :send_host_gene_counts, on: :member
    get :all_users, on: :member
    get :dimensions, on: :collection
    put :add_favorite, on: :member
    put :remove_favorite, on: :member
    put :update_project_visibility, on: :member
    put :add_user, on: :member
    put :update, on: :member
    post :validate_metadata_csv, on: :member
    post :upload_metadata, on: :member
    post :validate_sample_names, on: :member
    get :metadata_fields, on: :collection
  end
  get 'projects/:id/csv', to: 'projects#send_project_csv'
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
  get 'visualizations/heatmap_metrics.json', to: 'visualizations#heatmap_metrics'
  get 'visualizations/download_heatmap', to: 'visualizations#download_heatmap'
  post 'visualizations/:type/save', to: 'visualizations#save'
  get 'visualizations/:type(/:id)', to: 'visualizations#visualization'
  post 'visualizations/shorten_url', to: 'visualizations#shorten_url'
  get 'visualizations.json', to: 'visualizations#index'

  get 'amr_heatmap/amr_counts.json', to: 'amr_heatmap#amr_counts'
  get 'amr_heatmap/fetch_ontology.json', to: 'amr_heatmap#fetch_ontology'
  get 'amr_heatmap', to: 'amr_heatmap#index'

  get 'basespace/oauth', to: 'basespace#oauth'
  get 'basespace/projects', to: 'basespace#projects'
  get 'basespace/samples_for_project', to: 'basespace#samples_for_project'

  get 'samples/:sample_id/pipeline_viz(/:pipeline_version)', to: 'pipeline_viz#show',
                                                             constraints: { pipeline_version: /\d+\.\d+/ } # To allow period in pipeline version parameter

  resources :bulk_downloads, only: [:create, :index, :show] do
    get :types, on: :collection
    get :presigned_output_url, on: :member
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
  get 'pub/:share_id/samples/metadata_fields', to: 'snapshot_samples#metadata_fields'
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

  resources :frontend_metrics, only: :create

  resources :host_genomes

  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]
  get 'users/:id', to: 'users#edit'

  resources :benchmarks, only: [:index]

  namespace :playground do
    get :controls
    get :components
    get :icons
    get :typography
    get :viz
  end

  resource :metadata do
    get :dictionary, on: :collection
    get :official_metadata_fields, on: :collection
    post :metadata_template_csv, on: :collection
    get :metadata_template_csv, on: :collection
    get :instructions, on: :collection
    get :metadata_for_host_genome, on: :collection
    post :validate_csv_for_new_samples, on: :collection
  end

  resource :locations do
    get :external_search, on: :collection
    get :map_playground, on: :collection
    get :sample_locations, on: :collection
  end

  resources :workflow_runs, only: [:index, :show] do
    get :results, on: :member
    get :zip_link, on: :member
    put :rerun, on: :member
    post :validate_workflow_run_ids, on: :collection
    post :created_by_current_user, on: :collection
  end

  resources :phylo_tree_ngs, only: [:create, :index, :new, :show] do
    get :choose_taxon, on: :collection
    get :download, on: :member
    get :validate_name, on: :collection
    put :rerun, on: :member
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
