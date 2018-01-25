require 'resque/server'

Rails.application.routes.draw do
  resources :backgrounds
  devise_for :users, controllers: {
    sessions: 'sessions',
    registrations: 'registrations'
  }
  resources :samples do
    put :reupload_source, on: :member
    put :kickoff_pipeline, on: :member
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
    get :fastqs_folder, on: :member
    post :bulk_upload, on: :collection
    post :save_metadata, on: :member
  end
  get 'samples/:id/fasta/:tax_level/:taxid/:hit_type', to: 'samples#show_taxid_fasta'

  resources :projects do
    get :visuals, on: :member
    get :make_project_reports_csv, on: :member
    get :project_reports_csv_status, on: :member
    get :send_project_reports_csv, on: :member
    put :add_favorite, on: :member
    put :remove_favorite, on: :member
    post :add_user_to_project, on: :member
  end
  resources :host_genomes
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]
  get 'users/all_emails', to: 'users#all_emails'

  mount Resque::Server.new, at: '/resque'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#index'
  get 'projects/:id/csv', to: 'projects#send_project_csv'
end
