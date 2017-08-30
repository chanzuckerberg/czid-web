class FixEncoding < ActiveRecord::Migration[5.1]
  def up
    execute "ALTER DATABASE #{current_database} DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci;"
    ActiveRecord::Base.connection.tables.each do |table|
      change_table(table, :options => 'ENGINE=InnoDB DEFAULT CHARSET=utf8') {}
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
