namespace :local_user_creation do
  desc "Create an admin user with given email and name in a local dev environment"
  task :admin, [:email, :name] => :environment do |_, args|
    unless args[:email] && args[:name]
      puts "Error creating new user: Email and name are required"
      next
    end

    puts "Creating admin user with email: \"#{args[:email]}\" and name: \"#{args[:name]}\""
    User.create(email: args[:email], name: args[:name], role: 1)
  end

  desc "Create a standard user with given email and name in a local dev environment"
  task :standard, [:email, :name] => :environment do |_, args|
    unless args[:email] && args[:name]
      puts "Error creating new user: Email and name are required"
      next
    end

    puts "Creating user with email: \"#{args[:email]}\" and name: \"#{args[:name]}\""
    User.create(email: args[:email], name: args[:name])
  end
end
