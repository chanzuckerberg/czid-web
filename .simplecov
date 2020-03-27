SimpleCov.start 'rails' do
  add_group "Services", "app/services"

  enable_coverage :branch
end
