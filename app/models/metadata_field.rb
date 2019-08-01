class MetadataField < ApplicationRecord
  has_and_belongs_to_many :host_genomes
  has_and_belongs_to_many :projects
  has_many :metadata, dependent: :destroy

  # ActiveRecord documentation summary

  # Name/key ex: "sample_type"
  # t.string :name

  # User-friendly display name ex: "Sample Type"
  # t.string :display_name

  # Human-readable description e.g. "Type of sample or tissue such as plasma, whole blood, etc."
  # t.string :description

  # Base data type. 0 for string, 1 for number, 2 for dates. Used for figuring out which column
  # to use in "metadata-data" ex: string_validated_value, number_validated_value,
  # date_validated_value.
  # t.integer :base_type

  # Name of a validation type corresponding to a 'hardcoded' validation function.
  # Ex: "positive_number" here would call a positive_number validator in code dynamically (with
  # a restricted set of functions we make).
  #
  # Our current plan is that the validation function will also do the duty of inferring the
  # specificity level to set. E.g. one location validator would infer if it's a country/state/
  # city name. One date validator would accept things like "2019", "2019-01", "2019-01-14" and
  # infer year/month/date from that.
  # t.string :validation_type

  # An array of options when applicable. Ex for nucleotide_type: ["DNA", "RNA"]. Unfortunately our
  # RDS flavor/version doesn't support json types so this is string.
  # t.string :options

  # If true then only allow users to use the options (i.e. no freetext).
  # t.integer :force_options

  # A hash that maps host genome ids to an array of examples for that metadata field and host genome.
  # Stored as JSON.
  # If the key is "all", the examples apply to all host genomes.
  # We separate by host genome because, for example, valid sample_types are different for human vs mosquito,
  # and the examples should reflect this.
  # t.string :examples

  # +----------------------+
  # |      All fields      |
  # | +------------------+ |
  # | |      Core        | |
  # | | +--------------+ | |
  # | | |   Default    | | |
  # | | | +----------+ | | |
  # | | | | Required | | | |
  # | | | +__________+ | | |
  # | | +______________+ | |
  # | +__________________+ |
  # +______________________+

  # The core fields are basically the set of fields that we think are important/interesting/have
  # curated ourselves. All user-created custom types will not be core (unless we make them).
  # Ex: lat_lon could be a core field but not on new projects by default.
  # t.integer :is_core

  # Default fields are a subset of the core fields that will appear on a project when someone
  # creates a project. These can be removed from a project.
  # t.integer :is_default

  # Required fields are a subset of the core/default fields that cannot be removed from the
  # project. This is the strictest level. Ex: collection_date, location, nucleotide_type, etc.
  # t.integer :is_required

  # Name of a group of fields for the frontend. Ex: Sample, Donor, Infection, Sequencing, etc.
  # t.string :group

  # Certain meta-fields are appropriate for different (and potentially multiple) hosts. E.g.
  # "Discharge Date" is only for humans. Therefore host genomes have many meta-fields and
  # meta-fields have many host genomes. This is a way of handling many-to-many /
  # has_and_belongs_to_many in Rails.
  # create_join_table :host_genomes, :metadata_fields

  # User-defined meta-fields will belong to each (and potentially multiple) projects. So
  # meta-fields have many projects and projects have many meta-fields.
  # When a user creates a new project, they'll basically get a list of all the meta-fields marked
  # "default". Then they can add and subtract from their set of meta-fields from there.
  # create_join_table :projects, :metadata_fields

  # Whether this metadata field should be added automatically to new host genomes.
  # t.integer :default_for_new_host_genome, limit: 1, default: 0

  # Important attributes for the frontend
  def field_info
    {
      key: name,
      dataType: Metadatum.convert_type_to_string(base_type),
      name: display_name,
      options: options && JSON.parse(options),
      group: group,
      host_genome_ids: host_genome_ids,
      description: description,
      is_required: is_required,
      examples: examples && JSON.parse(examples),
      default_for_new_host_genome: default_for_new_host_genome,
    }
  end

  def add_examples(new_examples, host_genome = "all")
    if host_genome == "all"
      add_examples_helper(new_examples, "all")
    # If a host genome is specified, make sure the metadata field applies to that host.
    elsif host_genomes.where(name: host_genome).length == 1
      add_examples_helper(new_examples, host_genomes.find_by(name: host_genome).id)
    else
      raise "Invalid host genome"
    end
  end

  def remove_examples(examples_to_remove, host_genome = "all")
    if host_genome == "all"
      remove_examples_helper(examples_to_remove, "all")
    # If a host genome is specified, make sure the metadata field applies to that host.
    elsif host_genomes.where(name: host_genome).length == 1
      remove_examples_helper(examples_to_remove, host_genomes.find_by(name: host_genome).id)
    else
      raise "Invalid host genome"
    end
  end

  private

  def add_examples_helper(new_examples, host_genome)
    existing_examples = examples ? JSON.parse(examples) : {}

    # merge new examples using a set
    existing_examples_set = (existing_examples[host_genome] || []).to_set
    existing_examples_set.merge(new_examples)
    existing_examples[host_genome] = existing_examples_set.to_a

    update(examples: JSON.dump(existing_examples))
  end

  def remove_examples_helper(examples_to_remove, host_genome)
    existing_examples = examples ? JSON.parse(examples) : {}

    existing_examples[host_genome] ||= []
    existing_examples[host_genome] -= examples_to_remove

    update(examples: JSON.dump(existing_examples))
  end
end
