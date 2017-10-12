class CreateHostGenomes < ActiveRecord::Migration[5.1]
  def change
    create_table :host_genomes do |t|
      t.string :name, null:false, unique: true
      t.text :s3_star_index_path
      t.text :s3_bowtie2_index_path
      t.bigint :default_background_id
      t.timestamps
    end

    add_column :samples, :host_genome_id, :bigint

  end
end
