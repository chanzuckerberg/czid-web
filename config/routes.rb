require 'resque/server'

Rails.application.routes.draw do
  resources :backgrounds do
    get :show_taxon_dist, on: :member
  end
  devise_for :users, controllers: {
    sessions: 'sessions',
    registrations: 'registrations'
  }
  resources :samples do
    put :reupload_source, on: :member
    put :resync_prod_data_to_staging, on: :member
    put :kickoff_pipeline, on: :member
    put :retry_pipeline, on: :member
    get :all, on: :collection
    get :pipeline_runs, on: :member
    get :report_info, on: :member
    get :report_csv, on: :member
    get :bulk_new, on: :collection
    get :bulk_import, on: :collection
    get :upload, on: :collection
    get :nonhost_fasta, on: :member
    get :unidentified_fasta, on: :member
    get :contigs_fasta, on: :member
    get :contigs_summary, on: :member
    get :results_folder, on: :member
    get :raw_results_folder, on: :member
    post :bulk_upload, on: :collection
    post :bulk_upload_with_metadata, on: :collection
    get :metadata_types_by_host_genome_name, on: :collection
    get :metadata, on: :member
    get :metadata_fields, on: :collection
    get :contig_taxid_list, on: :member
    get :taxid_contigs, on: :member
    get :summary_contig_counts, on: :member
    get :samples_going_public, on: :collection
    get :index_v2, on: :collection
    get :details, on: :collection
    get :dimensions, on: :collection
    post :save_metadata, on: :member
    post :save_metadata_v2, on: :member
    post :validate_sample_files, on: :collection
  end

  get 'samples/:id/fasta/:tax_level/:taxid/:hit_type', to: 'samples#show_taxid_fasta'
  get 'samples/:id/alignment_viz/:taxon_info', to: 'samples#show_taxid_alignment_viz'
  get 'samples/heatmap', to: redirect(path: "visualizations/heatmap", status: 301)

  get 'cli_user_instructions', to: 'samples#cli_user_instructions'
  get 'select', to: 'home#index'
  get 'home', to: 'home#index'
  get 'taxon_descriptions', to: 'home#taxon_descriptions'
  get 'public', to: 'home#public'
  get 'library', to: 'home#library'
  post 'feedback', to: 'home#feedback'
  post 'sign_up', to: 'home#sign_up'
  get 'privacy', to: 'support#privacy'
  get 'terms', to: 'support#terms'
  get 'faqs', to: 'support#faqs'

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
    post :validate_metadata_csv, on: :member
    post :upload_metadata, on: :member
    post :validate_sample_names, on: :member
    get :metadata_fields, on: :collection
  end
  get 'projects/:id/csv', to: 'projects#send_project_csv'
  get 'choose_project', to: 'projects#choose_project'

  get 'phylo_trees/index', to: 'phylo_trees#index'
  get 'phylo_trees/show', to: 'phylo_trees#show'
  get 'phylo_trees/new', to: 'phylo_trees#new'
  post 'phylo_trees/create', to: 'phylo_trees#create'
  post 'phylo_trees/retry', to: 'phylo_trees#retry'
  get 'phylo_trees/:id/download', to: 'phylo_trees#download'
  get 'choose_taxon', to: 'phylo_trees#choose_taxon'
  get 'search_suggestions', to: 'samples#search_suggestions'

  get 'visualizations/samples_taxons.json', to: 'visualizations#samples_taxons'
  get 'visualizations/download_heatmap', to: 'visualizations#download_heatmap'
  post 'visualizations/:type/save', to: 'visualizations#save'
  get 'visualizations/:type(/:id)', to: 'visualizations#visualization'
  post 'visualizations/shorten_url', to: 'visualizations#shorten_url'
  get 'visualizations.json', to: 'visualizations#index'

  resources :host_genomes
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]

  namespace :playground do
    get :controls
    get :icons
  end

  resource :metadata do
    get :dictionary, on: :collection
    get :official_metadata_fields, on: :collection
    get :metadata_template_csv, on: :collection
    get :instructions, on: :collection
    post :validate_csv_for_new_samples, on: :collection
  end

  authenticate :user, ->(u) { u.admin? } do
    mount Resque::Server.new, at: "/resque"
  end

  # See health_check gem
  get 'health_check' => "health_check/health_check#index"

  # Un-shorten URLs. This should go second-to-last.
  get '/:id' => "shortener/shortened_urls#show"

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#landing'
end
