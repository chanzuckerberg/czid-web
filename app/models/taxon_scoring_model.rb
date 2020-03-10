# NOTE: This is DEPRECATED because there has only ever been one model in use.
#
# Scoring Model for Taxon
# the scoring model is represented in json with a tree structure where a parent will apply an operator to all the children and the leaf node could be a constant(const) or an attribute from the taxon (attr)
# Currently the operators supported are addition (+), product (-) for nodes with multiple children and atomic transformation function for nodes with one children.
# Here is an example of how the following scoring function can be translated to a json
#
# aggregate_score = |genus.NT.zscore|*species.NT.zscore*species.NT.rpm + |genus.NR.zscore|*species.NR.zscore*species.NR.rpm
# {
#  "op" : "+",
#  "on" : [
#    {
#      "op": "*",
#      "on": [
#        {
#          "op": "abs",
#          "on": { "op": "attr", "on": "genus.NT.zscore" }
#        },
#        { "op": "attr", "on": "species.NT.zscore" },
#        { "op": "attr", "on": "species.NT.rpm" }
#      ]
#    },
#    {
#      "op": "*",
#      "on": [
#        {
#          "op": "abs",
#          "on": { "op": "attr", "on": "genus.NR.zscore" }
#        },
#        { "op": "attr", "on": "species.NR.zscore" },
#        { "op": "attr", "on": "species.NR.rpm" }
#      ]
#    }
#  ]
# }
class TaxonScoringModel < ApplicationRecord
  include Math

  validates :name, presence: true, if: :mass_validation_enabled?
  validates :model_json, presence: true, if: :mass_validation_enabled?

  attr_accessor :model
  before_save :set_json, :validate_model
  after_find  :set_model

  # Expand the following as needed
  NUMERIC_FUNCTIONS = %w[abs abs2].freeze
  MATH_FUNCTIONS = %w[log10 sqrt].freeze

  DEFAULT_MODEL_NAME = 'aggregate_score'.freeze
  # DEFAULT_MODEL_NAME = 'kat_m1'.freeze
  MODEL_TYPE_LINEAR = 'linear'.freeze # Default
  MODEL_TYPE_LOGISTIC = 'logistic'.freeze
  LOGISTIC_SCALING_FACTOR = 1000

  RESP_PATHOGEN_LIST = [
    'Acinetobacter baumannii', 'Aspergillus flavus', 'Aspergillus fumigatus', 'Aspergillus niger',
    'Aspergillus terreus', 'Bacteroides fragilis', 'Blastomyces dermatitidis', 'Bordetella pertussis',
    'Burkholderia cenocepacia', 'Burkholderia pseudomallei', 'Chlamydia pneumoniae', 'Chlamydia psittaci',
    'Citrobacter freundii', 'Citrobacter koseri', 'Coccidioides immitis', 'Coccidioides posadasii',
    'Coxiella burnetii', 'Cryptococcus neoformans', 'Cryptococcus gattii VGI', 'Klebsiella aerogenes',
    'Enterobacter cloacae', 'Escherichia coli', 'Francisella tularensis', 'Fusobacterium necrophorum',
    'Fusobacterium nucleatum', 'Haemophilus influenzae', 'Histoplasma capsulatum', 'Moraxella catarrhalis',
    'Morganella morganii', 'Mucor', 'Mycobacterium tuberculosis', 'Mycoplasma pneumoniae', 'Nocardia',
    'Pasteurella multocida', 'Pneumocystis jirovecii', 'Proteus mirabilis', 'Pseudomonas aeruginosa',
    'Rhizomucor', 'Serratia marcescens', 'Streptococcus pneumoniae', 'Streptococcus pyogenes',
    'Streptococcus anginosus', 'Streptococcus intermedius', 'Streptococcus constellatus',
    'Staphylococcus aureus', 'Mastadenovirus', 'Alphacoronavirus', 'Betacoronavirus', 'Gammacoronavirus',
    'Cytomegalovirus', 'Human betaherpesvirus 5', 'Respirovirus', 'unidentified human coronavirus',
    'Human coronavirus 229E', 'Human parainfluenza', 'Human orthopneumovirus', 'Influenza A virus',
    'Influenza B virus', 'Influenza C virus', 'Parainfluenza virus', 'Respiratory syncytial virus',
    'Rhinovirus A', 'Rhinovirus B', 'Rhinovirus C', 'Klebsiella oxytoca', 'Klebsiella pneumoniae',
    'Legionella pneumophila', 'Metapneumovirus', 'Human orthopneumovirus',
  ].freeze
  PATHO_MAP = { "is_respiratory_patho" => RESP_PATHOGEN_LIST }.freeze

  def set_model
    self.model = JSON.parse(model_json)
  end

  def validate_model
    self.model ||= JSON.parse(model_json) if model_json
    score_work({}, self.model, true)
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

  def self.pathogen_features(taxon_info)
    species_name = taxon_info.dig('species', 'name') || taxon_info.dig(:species, :name)
    genus_name = taxon_info.dig('genus', 'name') || taxon_info.dig(:genus, :name)
    PATHO_MAP.each do |key, patho_list|
      taxon_info[key] = patho_list.include?(species_name) || patho_list.include?(genus_name) ? 1 : 0
    end
    taxon_info
  end

  def score(taxon_info)
    taxon_info = self.class.pathogen_features(taxon_info)
    score = score_work(self.class.flatten_taxon(taxon_info))
    if model_type == MODEL_TYPE_LOGISTIC
      score = 1.0 / (1.0 + exp(-score)) * LOGISTIC_SCALING_FACTOR
    end
    score
  end

  def score_work(taxon, score_func = model, validation_mode = false)
    op = score_func["op"] # return 0.0 might not be the best solution but could avoid fatal error TODO(yf): revisit
    raise "operator is not set for scoring function" if op.nil? && validation_mode
    return 0.0 unless op
    case op
    when "+"
      result = 0.0
      score_func["on"].each { |sf| result += score_work(taxon, sf) }
      return result
    when "*"
      result = 1.0
      score_func["on"].each { |sf| result *= score_work(taxon, sf) }
      return result
    when "inv" # inverse
      result = score_work(taxon, score_func["on"])
      return 1.0 / result
    when "const"
      return score_func["on"].to_f
    when "attr"
      return taxon[score_func["on"]].to_f
    else
      # atomic transformation function like abs, sqrt, log10
      result = score_work(taxon, score_func["on"])
      if NUMERIC_FUNCTIONS.include?(op)
        return result.send(op)
      elsif MATH_FUNCTIONS.include?(op)
        return send(op, result)
      else
        err_message = "Unknonw operator for taxonscoring: #{op}"
        raise err_message if validation_mode
        LogUtil.log_err_and_airbrake(err_message)
        return result
      end
    end
  end
end
