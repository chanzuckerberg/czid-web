class TaxonDescription < ApplicationRecord
  validates :wikipedia_id, presence: true, if: :mass_validation_enabled?

  def wiki_url
    "https://en.wikipedia.org/wiki/index.html?curid=#{wikipedia_id}"
  end
end
