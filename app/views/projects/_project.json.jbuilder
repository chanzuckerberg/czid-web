json.extract! project, :id, :name, :created_at, :updated_at, :description, :public_access
json.url project_url(project, format: :json)
