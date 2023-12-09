class CreateHostGenomes < ActiveRecord::Migration[5.1]
  NON_DEPRECATED_HG_KEYWORD = "active" # Dec 2023 addition. See below.

  def change
    create_table :host_genomes do |t|
      t.string :name, null:false, unique: true
      t.text :s3_star_index_path
      t.text :s3_bowtie2_index_path
      t.bigint :default_background_id
      t.timestamps

      # MUCH LATER, in the far-flung future of Dec 2023, we need to add the
      # deprecation_status column. However, we can't do that only in the future
      # DB migration because a lot of our migrations directly use `HostGenome`
      # (ex: 20181207202634_add_cat_genome.rb, etc). So those intermediate
      # migrations using HostGenome all start to break because the Dec 2023
      # HostGenome code makes use of the new column, but the DB state when it
      # tries to run those intermediate migrations doesn't have the col yet,
      # so running fresh migrations from the start crashes.
      # To be clear, this is ONLY an issue if you're trying to run migrations
      # from the very start up to current, like how we set up our testing DB.
      # For "real" DBs, like the Staging DB or Prod DB, this won't ever come up
      # because those will only ever care about the last few migrations since
      # they're living databases. (If we ever needed to migrate those DBs all
      # the way from the start, something would have gone terribly wrong, and
      # we would instead be re-loading from a snapshot.)
      # So to get around this issue, we have the ordinary future migration of
      # 20231130002352_allow_for_host_genome_deprecation.rb to handle "real"
      # databases, while we're adding the same column here to enable migrating
      # a new DB from scratch, like we do with our testing DB. And the future
      # migration marks its column adding as optional if the column already
      # exists, so it can cede control to this rewritten historical migration
      # in case things are being run fully from scratch.
      # SUMMARY: in the future, we added this col to the historical migration
      # to avoid conflicts when setting up test DB. No impact to Staging/Prod.
      t.string :deprecation_status, default: NON_DEPRECATED_HG_KEYWORD, null: false, comment: "Non-deprecated HostGenomes should use keyword `#{NON_DEPRECATED_HG_KEYWORD}`, otherwise should be a brief message explaining deprecation, eg, 'v1, deprecated on Nov 29 2023'." # VOODOO update to be exact col match
    end

    add_column :samples, :host_genome_id, :bigint

  end
end
