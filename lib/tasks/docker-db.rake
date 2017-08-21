namespace :db do

  task :start do
    o = `docker ps`
    if o.include?("mysql")
      puts "mysql container already running"
    else
      `docker run --rm --name mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -e MYSQL_DATABASE=idseq_development -p 6033:3306 -d mysql:5.7`
    end
  end

  task :stop do
    `docker stop mysql`
  end
end
