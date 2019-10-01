json.name attr[:dag_name]

json.output_dir_s3 "s3://#{attr[:bucket]}/samples/#{attr[:project_id]}/#{attr[:sample_id]}/results"

json.targets do
  
end
