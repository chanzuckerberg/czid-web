FactoryBot.define do
  factory :admin, class: User do
    email { "admin@example.com" }
    password { "admin_password" }
    name { "Admin User" }
  end
end
