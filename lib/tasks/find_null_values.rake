desc 'Finds database columns that have NULL values'

task 'find_cols_that_have_nulls', [:max_per_model, :only_presence_true] => :environment do |_t, args|
  ActiveRecord::Base.logger.level = :info
  Rails.application.eager_load!
  models = ApplicationRecord.descendants

  args.with_defaults(max_per_model: 1_000_000)
  args.with_defaults(only_presence_true: false)

  models.each do |model|
    puts "\nFinding #{model} cols that have NULL values ..."
    cols = cols_that_have_nulls(model, args.max_per_model, args.only_presence_true)
    unless cols.values.sum.zero?
      puts "Model #{model.name} has NULLs in #{args.only_presence_true ? 'presence: true' : ''} columns: #{JSON.pretty_generate(cols)}"
    end
    puts get_total_message(args.max_per_model, model)
  end
end

def cols_that_have_presence(model)
  cols = model.columns.select(&:null).select do |col|
    presences = model.validators_on(col.name).select { |validator| validator.class.name == "ActiveRecord::Validations::PresenceValidator" }
    presences[0]
  end
  cols
end

def cols_that_have_nulls(model, max_per_model, only_presence_true)
  cols = if only_presence_true
           cols_that_have_presence(model)
         else
           model.columns
         end
  counts = cols.select(&:null).map do |col|
    sql = "
      SELECT COUNT(*) AS t,
        SUM(IF(`#{col.name}` IS NULL, 1, 0)) AS c,
        MAX(IF(`#{col.name}` IS NOT NULL, created_at, NULL)) AS d
        FROM #{model.table_name}
        WHERE id > (SELECT MAX(id) - #{max_per_model} FROM #{model.table_name})
    "
    total, count, date = ActiveRecord::Base.connection.execute(sql).to_a[0]
    begin
      last = date.to_date
    rescue StandardError
      last = nil
    end
    ["#{col.name}, #{last}", (count.to_f / total).round(2)]
  end
  counts.compact.sort_by { |row| row[1] }.to_h
end

def get_total_message(max_per_model, model)
  puts "Finished checking #{[max_per_model.to_i, model.count].min} most recent records out of #{model.count} in the database."
end
