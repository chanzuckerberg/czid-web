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
    put :kickoff_pipeline, on: :member
    put :retry_pipeline, on: :member
    get :all, on: :collection
    get :pipeline_runs, on: :member
    get :report_info, on: :member
    get :report_csv, on: :member
    get :search_list, on: :member
    get :bulk_new, on: :collection
    get :bulk_import, on: :collection
    get :nonhost_fasta, on: :member
    get :unidentified_fasta, on: :member
    get :results_folder, on: :member
    post :bulk_upload, on: :collection
    post :save_metadata, on: :member
    post :add_taxon_confirmation, on: :member
    post :remove_taxon_confirmation, on: :member
    get :samples_taxons, on: :collection
    get :heatmap, on: :collection
    get :download_heatmap, on: :collection
  end
  get 'samples/:id/fasta/:tax_level/:taxid/:hit_type', to: 'samples#show_taxid_fasta'
  get 'samples/:id/assembly/:taxid', to: 'samples#assembly'
  get 'samples/:id/alignment/:taxon_info', to: 'samples#show_taxid_alignment'
  get 'samples/:id/alignment_viz/:taxon_info', to: 'samples#show_taxid_alignment_viz'
  get 'cli_user_instructions', to: 'samples#cli_user_instructions'
  get 'select', to: 'home#index'
  get 'home', to: 'home#index'
  get 'taxon_descriptions', to: 'home#taxon_descriptions'
  post 'feedback', to: 'home#feedback'
  post 'sign_up', to: 'home#sign_up'

  resources :projects do
    get :make_project_reports_csv, on: :member
    get :project_reports_csv_status, on: :member
    get :send_project_reports_csv, on: :member
    get :make_host_gene_counts, on: :member
    get :host_gene_counts_status, on: :member
    get :send_host_gene_counts, on: :member
    get :all_users, on: :member
    put :add_favorite, on: :member
    put :remove_favorite, on: :member
    put :update_project_visibility, on: :member
    put :add_user, on: :member
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

  resources :host_genomes
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]

  namespace :playground do
    get :controls
  end

  authenticate :user, ->(u) { u.admin? } do
    mount Resque::Server.new, at: "/resque"
  end

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#landing'
end
