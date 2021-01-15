class SnapshotLink < ApplicationRecord
  belongs_to :project

  SHARE_ID_LENGTH = 10

  def self.generate_random_share_id
    allowed_chars = ('a'..'z').to_a + ('A'..'Z').to_a + ('0'..'9').to_a
    ambiguous_chars = %w[i l I 1 o O 0 B 8 S 5 Z 2 G 6]
    allowed_chars -= ambiguous_chars
    loop do
      share_id = ""
      SHARE_ID_LENGTH.times do
        share_id << allowed_chars[rand(allowed_chars.length - 1)]
      end
      break share_id unless SnapshotLink.find_by(share_id: share_id)
    end
  end

  def fetch_snapshot_backgrounds
    Background.where(user_id: creator_id).or(Background.where(public_access: 1))
  end
end
