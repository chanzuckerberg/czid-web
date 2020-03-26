require 'coveralls'
Coveralls.wear_merged!

SimpleCov.formatter = SimpleCov::Formatter::MultiFormatter.new([
  SimpleCov::Formatter::HTMLFormatter,
  Coveralls::SimpleCov::Formatter,
])
SimpleCov.start 'rails' do
  add_group "Services", "app/services"
end
