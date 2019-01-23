class AssociateMetadataFields < ActiveRecord::Migration[5.1]
  # rubocop:disable SkipsModelValidations

  def up
    # Make custom metadata fields for Mosquito projects
    to_create = []

    to_create << MetadataField.new(
      name: "other_infections",
      display_name: "Other Infections",
      description: "Information about infections at other sites",
      base_type: Metadatum::STRING_TYPE,
      group: "Infection",
      host_genomes: HostGenome.all
    )

    mosquito_genome = HostGenome.find_by(name: "Mosquito")
    if mosquito_genome
      to_create << MetadataField.new(
        name: "unique_id",
        display_name: "Unique ID",
        description: "ID for the specimen (in case of multiple samples from the same specimen)",
        base_type: Metadatum::STRING_TYPE,
        group: "Sample",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "collection_lat",
        display_name: "Collection Latitude",
        description: "Latitude of the original collection location",
        base_type: Metadatum::NUMBER_TYPE,
        group: "Sample",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "collection_long",
        display_name: "Collection Longitude",
        description: "Longitude of the original collection location",
        base_type: Metadatum::NUMBER_TYPE,
        group: "Sample",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "comp_id_genus",
        display_name: "Computed Genus",
        description: "Computationally-determined genus of the specimen",
        base_type: Metadatum::STRING_TYPE,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "comp_id_species",
        display_name: "Computed Species",
        description: "Computationally-determined species of the specimen",
        base_type: Metadatum::STRING_TYPE,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "reported_id_genus",
        display_name: "Reported Genus",
        description: "Reported/expected/human-identified genus of the specimen",
        base_type: Metadatum::STRING_TYPE,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "reported_id_species",
        display_name: "Reported Species",
        description: "Reported/expected/human-identified species of the specimen",
        base_type: Metadatum::STRING_TYPE,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "reported_sex",
        display_name: "Reported Sex",
        description: "Reported/expected/human-identified species of the specimen",
        base_type: Metadatum::STRING_TYPE,
        options: %w[Female Male],
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "comp_sex",
        display_name: "Computed Sex",
        description: "Computationally-determined sex of the specimen",
        base_type: Metadatum::STRING_TYPE,
        options: %w[Female Male],
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "id_method",
        display_name: "Identification Method",
        description: "Identification method used",
        base_type: Metadatum::STRING_TYPE,
        group: "Host",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "extraction_batch",
        display_name: "Extraction Batch",
        description: "Label for the extracted batch",
        base_type: Metadatum::STRING_TYPE,
        group: "Sequencing",
        host_genomes: [mosquito_genome]
      )

      to_create << MetadataField.new(
        name: "library_prep_batch",
        display_name: "Library Prep Batch",
        description: "Number given to library preparation from a group of samples",
        base_type: Metadatum::STRING_TYPE,
        group: "Sequencing",
        host_genomes: [mosquito_genome]
      )
    end

    # Create the fields unless they already exist
    to_create.each do |m|
      unless MetadataField.find_by(name: m.name)
        m.save
      end
    end

    # Change 'gender' field to 'sex'
    Metadatum.where(key: "gender").update_all(key: "sex")

    # Fill in metadata_field for existing entries with a name match
    MetadataField.all.each do |field|
      entries = Metadatum.where(key: field.name)
      entries.update_all(metadata_field_id: field.id)
    end

    # Add custom fields to the Mosquito projects
    ["Mosquito", "CDC Mosquito Pilot"].each do |p|
      if Project.find_by(name: p)
        Project.find_by(name: p).metadata_fields << MetadataField.where(name: %w[other_infections unique_id collection_lat collection_long comp_id_genus comp_id_species reported_id_genus reported_id_species reported_sex extraction_batch library_prep_batch])
      end
    end

    # Make some indexes unique
    remove_index :metadata_fields, :name
    add_index :metadata_fields, :name, unique: true

    remove_index :metadata_fields_projects, ["project_id", "metadata_field_id"]
    add_index :metadata_fields_projects, ["project_id", "metadata_field_id"], name: "index_projects_metadata_fields", unique: true

    remove_index :host_genomes_metadata_fields, ["host_genome_id", "metadata_field_id"]
    add_index :host_genomes_metadata_fields, ["host_genome_id", "metadata_field_id"], name: "index_host_genomes_metadata_fields", unique: true

    remove_index :host_genomes_metadata_fields, ["metadata_field_id", "host_genome_id"]
    add_index :host_genomes_metadata_fields, ["metadata_field_id", "host_genome_id"], name: "index_metadata_fields_host_genomes", unique: true

    remove_index :metadata_fields_projects, ["project_id", "metadata_field_id"]
    add_index :metadata_fields_projects, ["project_id", "metadata_field_id"], name: "index_projects_metadata_fields", unique: true
  end

  def down
    MetadataField.where(name: %w[other_infections unique_id collection_lat collection_long comp_id_genus comp_id_species reported_id_genus reported_id_species reported_sex extraction_batch library_prep_batch id_method comp_sex]).delete_all

    Metadatum.where(key: "sex").update_all(key: "gender", metadata_field_id: nil)

    ["Mosquito", "CDC Mosquito Pilot"].each do |p|
      if Project.find_by(name: p)
        Project.find_by(name: p).update(metadata_fields: [])
      end
    end

    remove_index :metadata_fields, :name
    add_index :metadata_fields, :name

    remove_index :metadata_fields_projects, ["project_id", "metadata_field_id"]
    add_index :metadata_fields_projects, ["project_id", "metadata_field_id"], name: "index_projects_metadata_fields"

    remove_index :host_genomes_metadata_fields, ["host_genome_id", "metadata_field_id"]
    add_index :host_genomes_metadata_fields, ["host_genome_id", "metadata_field_id"], name: "index_host_genomes_metadata_fields"

    remove_index :host_genomes_metadata_fields, ["metadata_field_id", "host_genome_id"]
    add_index :host_genomes_metadata_fields, ["metadata_field_id", "host_genome_id"], name: "index_metadata_fields_host_genomes"

    remove_index :metadata_fields_projects, ["project_id", "metadata_field_id"]
    add_index :metadata_fields_projects, ["project_id", "metadata_field_id"], name: "index_projects_metadata_fields"
  end
end
