require 'resque/server'

Rails.application.routes.draw do
  resources :backgrounds
  resources :reports
  resources :pipeline_outputs, only: [:index, :show]
  devise_for :users, controllers: {
    sessions: 'sessions',
    registrations: 'registrations'
  }
  resources :samples do
    put :reupload_source, on: :member
    put :kickoff_pipeline, on: :member
    get :genus_list, on: :member
    get :pipeline_runs, on: :member
    get :search, on: :collection
    post :save_note, on: :collection
  end
  resources :projects
  resources :host_genomes
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]
  mount Resque::Server.new, at: '/resque'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#home'
  get 'pipeline_outputs/:id/fasta/:tax_level/:taxid/:hit_type', to: 'pipeline_outputs#show_taxid_fasta'
  get 'pipeline_outputs/:id/nonhost_fasta', to: 'pipeline_outputs#send_nonhost_fasta'
  get 'pipeline_outputs/:id/unidentified_fasta', to: 'pipeline_outputs#send_unidentified_fasta'
end
