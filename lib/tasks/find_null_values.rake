
desc 'Finds database columns that are have NULL values'

task 'find_cols_that_have_nulls', [:max_per_model, :only_presence_true] => :environment do |_t, args|
  ActiveRecord::Base.logger.level = :info
  Rails.application.eager_load!
  models = ApplicationRecord.descendants

  args.with_defaults(max_per_model: 100000)
  args.with_defaults(only_presence_true: true)

  models.each do |model|
    puts "\nFinding #{model} cols that have NULL values ..."
    cols = cols_that_have_nulls(model, args.max_per_model)
    unless cols.empty?
      puts "Model #{model.name} has NULLs in #{args.only_presence_true ? "presence: true" : ""} columns: #{JSON.pretty_generate(cols)}"
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

def cols_that_have_nulls(model, max_per_model, only_presence_true = true)
  cols = if only_presence_true
           cols_that_have_presence(model)
         else
           model.columns
         end
  counts = cols.select(&:null).map do |col|
    sql = "
      SELECT COUNT(*) AS c FROM #{model.table_name}
      WHERE `#{col.name}` IS NULL
        AND id > (SELECT MAX(id) - #{max_per_model} FROM #{model.table_name})
    "
    count = ActiveRecord::Base.connection.execute(sql).to_a[0][0]
    [col.name, count.to_f / max_per_model]
  end
  counts.compact.to_h
end

def get_total_message(max_per_model, model)
  puts "Finished checking #{[max_per_model.to_i, model.count].min} most recent records out of #{model.count} in the database."
end
