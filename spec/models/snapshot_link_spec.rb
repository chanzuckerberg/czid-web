require 'rails_helper'

SHARE_ID_LENGTH = 10

describe SnapshotLink, type: :model do
  context "#generate_random_share_id" do
    it "should return a valid share_id (unique, alphanumeric, excludes ambiguous chars)" do
      existing_share_ids = SnapshotLink.all.pluck(:share_id).to_set
      share_id = SnapshotLink.generate_random_share_id

      expect(existing_share_ids.exclude?(share_id)).to be(true)
      expect(share_id.count("^a-zA-Z0-9")).to eq(0)
      expect(share_id.count("ilI1oO0B8S5Z2G6")).to eq(0)
      expect(share_id.length).to eq(SHARE_ID_LENGTH)
    end
  end
end
