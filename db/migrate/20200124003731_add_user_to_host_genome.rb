class AddUserToHostGenome < ActiveRecord::Migration[5.1]
  def change
    add_reference :host_genomes, :user, foreign_key: true, comment: "The user that created the host genome. Values previous to 2020-02 may be NULL."
  end
end
