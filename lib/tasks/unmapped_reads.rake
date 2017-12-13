task populate_unmapped_reads: :environment do
  PipelineOutput.all.each do |po|
      po.update!(unmapped_reads: po.count_unmapped_reads)
  end
end

