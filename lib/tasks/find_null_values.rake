
desc 'Finds database columns that are have NULL values'

task 'find_cols_that_have_nulls', [:max_per_model] => :environment do |_t, args|
  ActiveRecord::Base.logger.level = :info
  Rails.application.eager_load!
  models = ApplicationRecord.descendants

  args.with_defaults(max_per_model: 10)
  models.each do |model|
    puts "\nFinding #{model} cols that have NULL values ..."
    cols = cols_that_have_nulls(model, args.max_per_model)
    unless cols.empty?
      puts "Model #{model.name} has NULLs in columns: #{JSON.pretty_generate(cols)}"
    end
    puts get_total_message(args.max_per_model, model)
  end
end

def cols_that_have_nulls(model, max_per_model)
  counts = model.columns.select(&:null).map do |col|
    sql = "
      SELECT COUNT(*) AS c FROM #{model.table_name}
      WHERE `#{col.name}` IS NULL
        AND id > (SELECT MAX(id) - #{max_per_model} FROM #{model.table_name})
    "
    count = ActiveRecord::Base.connection.execute(sql).to_a[0][0]
    count > 0 ? [col.name, count] : nil
  end
  counts.compact.to_h
end

def get_total_message(max_per_model, model)
  puts "Finished checking #{[max_per_model.to_i, model.count].min} most recent records out of #{model.count} in the database."
end
