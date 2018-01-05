module BackgroundsHelper
  def ids_from_params(params, key)
    params[key] ? params[key].reject { |id| id.blank? }.map(&:to_i) : nil
  end

  def same_contents(array1, array2)
    if array1 && array2
      return (array1.sort == array2.sort)
    elsif array1.blank? && array2.blank?
      return true
    end
    return false
  end

  def assign_attributes_and_has_changed?(new_params)
    # Handle nested parameters
    current_pipeline_output_ids = @background.pipeline_outputs.map(&:id)
    current_sample_ids = @background.samples.map(&:id)
    new_pipeline_output_ids = ids_from_params(new_params, :pipeline_output_ids)
    new_sample_ids = ids_from_params(new_params, :sample_ids)
    # Assign new attributes without saving
    @background.assign_attributes(new_params)
    # Return whether there are changes
    Rails.logger.info("BG IN HELPER: #{@background.changed?}")
    Rails.logger.info("BG IN HELPER: #{!same_contents(current_pipeline_output_ids, new_pipeline_output_ids)}")
    Rails.logger.info("BG IN HELPER: #{!same_contents(current_sample_ids, new_sample_ids)}")
    @background.changed? || !same_contents(current_pipeline_output_ids, new_pipeline_output_ids) || !same_contents(current_sample_ids, new_sample_ids)
  end

  def archive_background(old_data)
    archived_background = ArchivedBackground.new
    archived_background.archive_of = @background.id
    archived_background.data = old_data
    archived_background.save
  end
end
