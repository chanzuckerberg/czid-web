class AddDescriptionToBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :description, :text
    add_column :backgrounds, :public_access, :tinyint
    add_column :backgrounds, :ready, :tinyint, default: 0

    background_ids_to_make_public = HostGenome.pluck(:default_background_id).compact.uniq
    Background.where(id: background_ids_to_make_public).update_all(public_access: 1) # rubocop:disable SkipsModelValidations

    ready_backgrounds = TaxonSummary.pluck(:background_id).compact.uniq
    Background.where(id: ready_backgrounds).update_all(ready: 1) # rubocop:disable SkipsModelValidations
  end
end
