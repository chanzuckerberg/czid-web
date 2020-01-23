class ChangeHostGenomeDefaults < ActiveRecord::Migration[5.1]
  def up
    HostGenome.find_each do |hg|
      if hg.s3_bowtie2_index_path.nil?
        hg.s3_bowtie2_index_path = HostGenome.s3_bowtie2_index_path_default
      end
      if hg.s3_star_index_path.nil?
        hg.s3_star_index_path = HostGenome.s3_star_index_path_default
      end
      if hg.skip_deutero_filter.nil?
        hg.skip_deutero_filter = 0
      end
      if hg.name.include?('Test')
        # Delete the test genomes. This can't delete good data because of
        # foreign keys.
        hg.destroy!
      elsif hg.changed?
        hg.save!
      end
    end

    change_column :host_genomes, :s3_bowtie2_index_path, :string, null: false, default: HostGenome.s3_bowtie2_index_path_default, comment: 'The path to the index file to be used in the pipeline by bowtie for host filtering.'
    change_column :host_genomes, :s3_star_index_path, :string, null: false, default: HostGenome.s3_star_index_path_default, comment: 'The path to the index file to be used in the pipeline by star for host filtering.'

    # Opportunistic addition of constraints
    change_column :host_genomes, :name, :string, null: false, comment: 'Friendly name of host genome. May be common name or scientific name of species. Must be unique and start with a capital letter.'
    add_index :host_genomes, :name, unique: true
    change_column :host_genomes, :skip_deutero_filter, :integer, default: 0, null: false, comment: 'See https://en.wikipedia.org/wiki/Deuterostome. This affects the pipeline.'
  end
end
