class TaxonDescription < ApplicationRecord
  def wiki_url
    "https://en.wikipedia.org/wiki/index.html?curid=#{wikipedia_id}"
  end
end
