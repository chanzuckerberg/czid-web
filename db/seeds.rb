# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#

project = Project.create!(name: "Awesome Project")
background = Background.new(name: "fake background")
HostGenome.create!(name: "human", default_background_id: 1)
alignment_config = AlignmentConfig.create!(name: "test config")

(1..5).each do |i|
  sample = Sample.new(name: "Sample #{i}", project: project,
                      sample_location: "California", sample_date: "Sept 19, 2017", sample_tissue: "CSF", sample_template: "RNA",
                      sample_library: "Nugen Nextera", sample_sequencer: "Illumina NextSeq 500, 2x150", sample_notes: "patient had no known infections")
  sample.input_files << InputFile.new(name: 'R1.fastq.gz', source_type: 'local', source: 'R1.fastq.gz')
  sample.input_files << InputFile.new(name: 'R2.fastq.gz', source_type: 'local', source: 'R2.fastq.gz')
  sample.save!
  taxon_counts = (1..50).map { |j| TaxonCount.new(tax_id: j, tax_level: [1, 2].sample, count: rand(1000), name: "Some Name", count_type: %w[NT NR].sample) }
  pipeline_run = PipelineRun.create!(sample: sample, command: "xyz yzyz", total_reads: 1_000, adjusted_remaining_reads: 500, taxon_counts: taxon_counts, alignment_config: alignment_config)
  pipeline_run.save!
  background.pipeline_runs << pipeline_run
end

background.save!
User.create!(email: "fake@example.com", name: "Fake User", password: "password", password_confirmation: "password", role: 1, authentication_token: "idseq1234")
