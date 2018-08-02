# Scoring Model for Taxon
# the scoring model is represented in json with a tree structure where a parent will apply an operator to all the children and the leaf node could be a constant(const) or an attribute from the taxon (attr)
# Currently the operators supported are addition (+), product (-) for nodes with multiple children and atomic transformation function for nodes with one children.
# Here is an example of how the following scoring function can be translated to a json
#
# aggregate_score = |genus.NT.Z|*species.NT.Z*species.NT.rpm + |genus.NR.Z|*species.NR.Z*species.NR.rpm
# {
#  "op" : "+",
#  "on" : [
#    {
#      "op": "*",
#      "on": [
#        {
#          "op": "abs",
#          "on": { "op": "attr", "on": "genus.NT.Z" }
#        },
#        { "op": "attr", "on": "species.NT.Z" },
#        { "op": "attr", "on": "species.NT.rpm" }
#      ]
#    },
#    {
#      "op": "*",
#      "on": [
#        {
#          "op": "abs",
#          "on": { "op": "attr", "on": "genus.NR.Z" }
#        },
#        { "op": "attr", "on": "species.NR.Z" },
#        { "op": "attr", "on": "species.NR.rpm" }
#      ]
#    }
#  ]
# }
class TaxonScoringModel < ApplicationRecord
  include Math
  attr_accessor :model
  before_save :set_json
  after_find  :set_model

  def set_model
    self.model = JSON.parse(model_json)
  end

  def set_json
    self.model_json = model.to_json
  end

  def model_json=(json)
    super(json)
    self.model = JSON.parse(json)
  end

  def self.flatten_taxon(taxon_info, prefix = "")
    result = {}
    taxon_info.each do |key, val|
      if val.is_a?(Hash)
        new_prefix = "#{prefix}#{key}."
        result.merge!(flatten_taxon(val, new_prefix))
      else
        result["#{prefix}#{key}"] = val
      end
    end
    result
  end

  def score(taxon, score_func = model)
    op = score_func["op"] # return 0.0 might not be the best solution but could avoid fatal error TODO(yf): revisit
    return 0.0 unless op
    case op
    when "+"
      result = 0.0
      score_func["on"].each { |sf| result += score(taxon, sf) }
      return result
    when "*"
      result = 1.0
      score_func["on"].each { |sf| result *= score(taxon, sf) }
      return result
    when "const"
      return score_func["on"].to_f
    when "attr"
      return taxon[score_func["on"]].to_f
    else
      # atomic transformation function like abs, sqrt, log10
      result = score(taxon, score_func["on"])
      begin
        # eg. result.abs
        return result.send(op)
      rescue
        # eg log10(result)
        return send(op, result)
      end
    end
  end
end
