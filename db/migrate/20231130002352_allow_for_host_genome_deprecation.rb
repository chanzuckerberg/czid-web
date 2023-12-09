class AllowForHostGenomeDeprecation < ActiveRecord::Migration[6.1]
  NON_DEPRECATED_HG_KEYWORD = "active"

  def up
    # Absolute best practice for putting a column with a default on a table
    # with existing rows is to add column, then add default, then do a later
    # data migration or manual change via rails console (to avoid tying up
    # your DB if it's suddenly needing to rewrite a billion rows, etc).
    # The `strong_migrations` gem would normally block the below.
    # However, this table only has <1000 rows on Prod at the time of writing
    # this migration, so I think it's reasonable to avoid the best practice
    # in favor of expedience. The `safety_assured` allows us to override that.
    safety_assured { add_column(
      :host_genomes,
      :deprecation_status,
      :string,
      default: NON_DEPRECATED_HG_KEYWORD,
      null: false,
      # `if_not_exists` is being used as a workaround to avoid conflicting with
      # historical migrations. See `20171011225553_create_host_genomes.rb`.
      if_not_exists: true,
      comment: "Non-deprecated HostGenomes should use keyword `#{NON_DEPRECATED_HG_KEYWORD}`, otherwise should be a brief message explaining deprecation, eg, 'v1, deprecated on Nov 29 2023'."
      ) }

    # Prior schema has a unique index on `name`. But with deprecation being
    # possible now, `name` is only guaranteed unique in combination with new col.
    add_index :host_genomes, [:name, :deprecation_status], unique: true
    # Only remove old unique index after new index is present, because app does
    # also make some use of index look up on `name`. So we want to keep it
    # until multi-col index exists and can then be used on subsequent queries.
    # [This is similarly purely for the sake of best practice, the index creation
    # will be super fast. But doing it by the book doesn't cause annoyance here.]
    remove_index :host_genomes, :name
  end

  def down
    # Down direction is slightly less stable because we can't bootstrap the
    # indexes the same way we did in `up` direction due to needing to drop
    # the `deprecation_status` col before we can have a unique index again.

    # If `up` went really badly and index was not created, `if_exists` below
    # allows us to just skip those as necessary and not error out.
    remove_index :host_genomes, [:name, :deprecation_status], if_exists: true
    remove_column :host_genomes, :deprecation_status, if_exists: true

    add_index :host_genomes, :name, unique: true
  end
end
