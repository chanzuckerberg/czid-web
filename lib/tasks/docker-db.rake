namespace :db do

  task :start do
    o = `docker ps`
    if o.include?("postgres")
      puts "posgres already running"
    else
      `docker run --rm --name postgres -p 5432:5432 -d postgres:9.6`
    end
  end

  task :stop do
    `docker stop postgres`
  end
end
