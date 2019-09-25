json.name attr[:dag_name]

json.output_dir_s3 "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results"

json.targets do
  json.fastqs [attr[:fastq1], attr[:fastq2]].compact

  json.validate_input_out [
                              "validate_input_summary.json",
                              "valid_input1.#{attr[:file_ext]}",
                              attr[:fastq2] ? "valid_input2.#{attr[:file_ext]}" : nil
                          ].compact

  json.star_out [
                    "unmapped1.#{attr[:file_ext]}",
                    attr[:fastq2] ? "unmapped2.#{attr[:file_ext]}" : nil
                ].compact


end
