require 'resque/server'

Rails.application.routes.draw do
  resources :backgrounds
  resources :reports
  resources :pipeline_outputs, only: [:index, :show]
  devise_for :users, :controllers => {
    sessions: 'sessions', 
    registrations: 'registrations' 
  }
  devise_scope :user do
    get 'login', to: 'devise/sessions#new'
    delete 'logout', to: 'devise/sessions#destroy'
  end
  resources :samples do
    put :reupload_source, on: :member
    put :kickoff_pipeline, on: :member
    get :pipeline_runs, on: :member
  end
  resources :projects
  resources :users, only: [:create, :new, :edit, :update, :destroy, :index]
  mount Resque::Server.new, at: '/resque'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#home'
end
