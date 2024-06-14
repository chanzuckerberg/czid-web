namespace :local_user_creation do
  desc "Create an admin user with given email and name in a local dev environment"
  task :admin, [:email, :name] => :environment do |_, args|
    unless args[:email] && args[:name]
      puts "Error creating new user: Email and name are required"
      next
    end

    puts "Creating admin user with email: \"#{args[:email]}\" and name: \"#{args[:name]}\""
    # set profile_form_version to bypass profile form
    User.create(email: args[:email], name: args[:name], role: 1, profile_form_version: 2)
  end

  desc "Create a standard user with given email and name in a local dev environment"
  task :standard, [:email, :name] => :environment do |_, args|
    unless args[:email] && args[:name]
      puts "Error creating new user: Email and name are required"
      next
    end

    puts "Creating user with email: \"#{args[:email]}\" and name: \"#{args[:name]}\""
    # set profile_form_version to bypass profile form
    User.create(email: args[:email], name: args[:name], profile_form_version: 2)
  end
end
