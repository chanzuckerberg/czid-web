class EnableHostGenomeVersioning < ActiveRecord::Migration[6.1]
  # Prior to this migration, `deprecation_status` approximated `version`.
  # At the moment of this migration, HG38+T2T (ie, Human v2) is "active".
  NON_DEPRECATED_KEYWORD = "active".freeze

  def up
    # For long-running DBs -- Staging / Prod / Local dev -- as of this writing
    # we have exactly 2 "Human" records: the old HG38-only (v1) and the new,
    # active HG38+T2T (v2). However, because of how the Testing DB gets set up,
    # it only has 1 "Human". There's a data migration that runs later to bring
    # Testing DB up to match, but for this schema we have to handle both cases
    # to keep our CI/CD from breaking when it tries to bootstrap the Testing DB.
    # Having to conditionally tweak the migration is not great, but it appears
    # to be the most reasonable option given the constraints we have.
    # If you need more info, check out description in PR #4215 or see CZID-8173.
    human_host_genome_count = HostGenome.where(name: "Human").count
    if human_host_genome_count > 2
      puts "DB should have no more than 2 Human records when this migration runs."
      raise ActiveRecord::MigrationError
    end

    # Normally shouldn't add a column with a default value since it blocks writes,
    # but this is OK since only the CZ ID team can create host genomes and the
    # host_genomes table is small (<1000 rows on Prod).
    safety_assured { add_column(
      :host_genomes,
      :version,
      :integer,
      default: 1,
      null: false,
      # `if_not_exists` is being used as a workaround to avoid conflicting with
      # historical migrations. See `20171011225553_create_host_genomes.rb`.
      if_not_exists: true,
      comment: "Version of this host's genome data, 1-indexed. Allows us to track multiple revisions of a certain host organism. Still, most hosts only have one version."
      ) }

    # If we have two "Human" records, the active is T2T and needs to be set as v2
    if human_host_genome_count == 2
      HostGenome.connection.execute("
        UPDATE host_genomes SET version = 2
        WHERE name = 'Human' AND deprecation_status = '#{NON_DEPRECATED_KEYWORD}'
      ")
    end


    # Having explicit `version` means that's where we need uniqueness now.
    add_index :host_genomes, [:name, :version], unique: true
    remove_index :host_genomes, [:name, :deprecation_status]

    # Since `deprecation_status` is now more of a flag + explanation on why a
    # record was deprecated, default and non-null need to go away.
    change_column(
      :host_genomes,
      :deprecation_status,
      :string,
      default: nil,
      null: true,
      comment: "Non-deprecated HostGenomes must be NULL. If deprecated, provide a brief message about deprecation, eg, 'deprecated on Nov 29 2023'."
      )

    # Since intended usage of `deprecation_status` has changed, all currently
    # "active" records need to be set to NULL/nil.
    # `safety_assured` is okay again for the same reasons as above one was.
    safety_assured { HostGenome.where(deprecation_status: NON_DEPRECATED_KEYWORD).update_all(deprecation_status: nil) }
  end

  def down
    add_index :host_genomes, [:name, :deprecation_status], unique: true
    remove_index :host_genomes, [:name, :version]
    safety_assured { HostGenome.where(deprecation_status: nil).update_all(deprecation_status: NON_DEPRECATED_KEYWORD) }

    safety_assured { change_column(
      :host_genomes,
      :deprecation_status,
      :string,
      default: NON_DEPRECATED_KEYWORD,
      null: false,
      comment: "Non-deprecated HostGenomes should use keyword `#{NON_DEPRECATED_KEYWORD}`, otherwise should be a brief message explaining deprecation, eg, 'v1, deprecated on Nov 29 2023'."
      ) }
    remove_column :host_genomes, :version, if_exists: true
  end
end
