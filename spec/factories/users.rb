FactoryBot.define do
  factory :admin, class: User do
    email { "admin@example.spec.com" }
    password { "admin_password" }
    name { "Admin User" }
    role { 1 }
  end

  factory :joe, class: User do
    email { "joe@gmail.spec.com" }
    password { "joe_password" }
    name { "Joe" }
  end
end
