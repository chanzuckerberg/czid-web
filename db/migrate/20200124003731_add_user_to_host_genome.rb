class AddUserToHostGenome < ActiveRecord::Migration[5.1]
  def change
    add_reference :host_genomes, :user, foreign_key: true
  end
end
