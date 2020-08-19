class SnapshotLink < ApplicationRecord
  belongs_to :project

  SHARE_ID_LENGTH = 20

  def self.generate_random_share_id
    allowed_chars = ('a'..'z').to_a + ('A'..'Z').to_a + ('0'..'9').to_a
    ambiguous_chars = %w[i l I 1 o O 0 B 8 S 5 Z 2 G 6]
    allowed_chars -= ambiguous_chars
    existing_share_ids = SnapshotLink.all.pluck(:share_id).to_set
    loop do
      share_id = ""
      SHARE_ID_LENGTH.times do
        share_id << allowed_chars[rand(allowed_chars.length - 1)]
      end
      break share_id unless existing_share_ids.include?(share_id)
    end
  end
end
