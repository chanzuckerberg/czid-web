# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#

project = Project.create!(name: "Awesome Project")

(1..5).each do |i|
  sample = Sample.new(name: "Sample #{i}", project: project,
    sample_host: "Human", sample_location: "California", sample_date: "Sept 19, 2017", sample_tissue: "CSF", sample_template: "RNA",
    sample_library: "Nugen Nextera", sample_sequencer: "Illumina NextSeq 500, 2x150", sample_notes: "patient had no known infections")
  sample.input_files << InputFile.new(name: 'R1.fastq.gz', source_type: 'local')
  sample.input_files << InputFile.new(name: 'R2.fastq.gz', source_type: 'local')
  sample.save!
  taxon_counts = (1..50).map {|j| TaxonCount.new(tax_id: j, tax_level: [1, 2].sample, count: rand(1000), name: "Some Name", count_type: ["NT", "NR"].sample) }
  pipeline_run = PipelineRun.create!(sample  : sample, command: "xyz yzyz")
  output = PipelineOutput.create!(sample: sample, total_reads: 1_000, remaining_reads: 500, taxon_counts: taxon_counts, pipeline_run: pipeline_run)
  pipeline_run.pipeline_output_id = output.id
  pipeline_run.save!
end

user = User.create!(email: "fake@example.com", name: "Fake User", password: "password", password_confirmation: "password", role: 1, authentication_token: "idseq1234")
