class FixEncoding < ActiveRecord::Migration[5.1]
  def up
    execute "ALTER DATABASE #{current_database} DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci;"
    ActiveRecord::Base.connection.tables.each do |table|
      execute "ALTER TABLE `#{current_database}`.`#{table}` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;"
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
