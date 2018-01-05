require 'resque/server'

Rails.application.routes.draw do
  resources :backgrounds
  resources :pipeline_outputs, only: [:index, :show]
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
    post :bulk_upload, on: :collection
    post :save_metadata, on: :member
  end

  resources :projects do
    get :visuals, on: :member
    put :add_favorite, on: :member
    put :remove_favorite, on: :member
  end
  resources :host_genomes
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]

  mount Resque::Server.new, at: '/resque'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#index'
  get 'pipeline_outputs/:id/fasta/:tax_level/:taxid/:hit_type', to: 'pipeline_outputs#show_taxid_fasta'
  get 'pipeline_outputs/:id/nonhost_fasta', to: 'pipeline_outputs#send_nonhost_fasta'
  get 'pipeline_outputs/:id/unidentified_fasta', to: 'pipeline_outputs#send_unidentified_fasta'
  get 'projects/:id/csv', to: 'projects#send_project_csv'
end
