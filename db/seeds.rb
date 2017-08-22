# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#

project = Project.create!(name: "Awesome Project")

(1..5).each do |i|
  sample = Sample.create!(name: "Sample #{i}", project: project)
  taxon_counts = (1..10).map {|j| TaxonCount.new(tax_id: j, tax_level: 3, count: rand(1000)) }
  output = PipelineOutput.create!(sample: sample, total_reads: 1_000, remaining_reads: 500, taxon_counts: taxon_counts)
end

user = User.create!(email: "fake@example.com", name: "Fake User", password: "password", password_confirmation: "password")
