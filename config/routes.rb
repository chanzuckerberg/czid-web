Rails.application.routes.draw do
  devise_for :users
  resources :samples
  resources :projects
  resources :users
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: "home#home"
end
