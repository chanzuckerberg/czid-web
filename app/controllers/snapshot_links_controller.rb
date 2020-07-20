class SnapshotLinksController < ApplicationController
  before_action do
    allowed_feature_required("edit_snapshot_links")
  end

  def create
  end
end
