require 'resque/server'

Rails.application.routes.draw do
  resources :pipeline_outputs
  devise_for :users
  resources :samples do
    get :insert, on: :collection
  end
  resources :projects
  resources :users
  mount Resque::Server.new, at: '/resque'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'home#home'
end
