module BackgroundsHelper
  def ids_from_params(params, key)
    params[key] ? params[key].reject(&:blank?).map(&:to_i) : nil
  end

  def same_contents(array1, array2)
    if array1 && array2
      return (array1.sort == array2.sort)
    elsif array1.blank? && array2.blank?
      return true
    end
    false
  end

  def assign_attributes_and_has_changed?(new_params)
    # Handle nested parameters
    current_pipeline_output_ids = @background.pipeline_outputs.map(&:id)
    current_sample_ids = @background.samples.map(&:id)
    new_pipeline_output_ids = ids_from_params(new_params, :pipeline_output_ids)
    new_sample_ids = ids_from_params(new_params, :sample_ids)
    # Assign new attributes without saving
    @background.assign_attributes(new_params)
    # Return whether there are changes or not
    @background.changed? || !same_contents(current_pipeline_output_ids, new_pipeline_output_ids) || !same_contents(current_sample_ids, new_sample_ids)
  end

  def archive_background_to_db(old_data)
    archived_background = ArchivedBackground.new
    archived_background.archive_of = @background.id
    archived_background.data = old_data
    archived_background.save
  end

  def archive_background_to_s3(old_data)
    file = Tempfile.new
    file.write(old_data)
    file.close
    destination_filename = "background_#{@background.id}_#{Time.now.in_time_zone.to_s(:number)}.json"
    s3_destination = "s3://#{SAMPLES_BUCKET_NAME}/backgrounds/#{@background.id}/#{destination_filename}"
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", file.path.to_s, s3_destination)
    status.exitstatus.zero?
  end
end
