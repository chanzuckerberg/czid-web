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
    get :pipeline_runs, on: :member
    post :save_note, on: :collection
  end
  resources :projects
  resources :host_genomes
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]
  mount Resque::Server.new, at: '/resque'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#home'
  get 'pipeline_outputs/:id/:taxid/fasta', to 'pipeline_outputs#show_taxid_fasta'
end
