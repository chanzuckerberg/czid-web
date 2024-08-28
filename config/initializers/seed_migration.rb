SeedMigration.config do |c|
  c.migration_table_name = "seed_migrations"
  c.migrations_path = "seeds"
  c.ignore_ids = true

  c.register "AppConfig" do
    exclude :id, :created_at, :updated_at
  end

  c.register "AlignmentConfig" do
    exclude :id, :created_at, :updated_at
  end

  c.register "Background" do
    exclude :id, :created_at, :updated_at
  end

  c.register "Citation" do
    exclude :created_at, :updated_at
  end

  c.register "HostGenome" do
    exclude :id, :created_at, :updated_at
  end

  c.register "MetadataField" do
    exclude :id, :created_at, :updated_at
  end

  c.register "SampleType" do
    exclude :id, :created_at, :updated_at
  end

  c.register "User" do
    exclude :id, :created_at, :updated_at
  end

  c.register "WorkflowVersion" do
    exclude :id, :created_at, :updated_at
  end

  c.register "PathogenList" do
    exclude :created_at, :updated_at
  end

  c.register "PathogenListVersion" do
    exclude :created_at, :updated_at
  end

  c.register "Pathogen" do
    exclude :created_at, :updated_at
  end
end
