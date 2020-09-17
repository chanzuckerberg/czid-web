task populate_project_creators: :environment do
  Project.where(creator_id: nil).each do |proj|
    first_sample = Sample.where(project_id: proj.id).order("id ASC").first

    if first_sample
      user_id = first_sample.user_id
      puts "Setting creator for Project #{proj.id} to User #{user_id} (via first sample)"
      proj.update!(creator_id: user_id)
    elsif proj.users.present?
      user_id = proj.users[0].id
      puts "Setting creator for Project #{proj.id} to User #{user_id} (via first collaborator)"
      proj.update!(creator_id: user_id)
    else
      # This shouldn't happen, but just in case.
      puts "Project #{proj.id} has no samples or users. Skipping."
    end
  end
end
