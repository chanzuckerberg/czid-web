class AddUserToHostGenome < ActiveRecord::Migration[5.1]
  def change
    # TODO: (gdingle): make not null and fill with .... or allow null?
    # admin_use = User.find_by(email: "gdingle@chanzuckerberg.com", admin: true)
    add_column :host_genomes, :user_id, :bigint
    add_reference :host_genomes, :user, foreign_key: true
  end
end
