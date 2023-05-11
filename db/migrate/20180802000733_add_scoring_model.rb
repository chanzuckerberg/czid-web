class AddScoringModel < ActiveRecord::Migration[5.1]
  def change
    # Robert -- May 8 2023:
    # We used to stored custom taxon scoring models that helped calculate an aggregate score
    # on the sample report page (https://chanzuckerberg.zendesk.com/hc/en-us/articles/360034790574-Single-Sample-Report-Table#score)
    # But we have not been using this for years, and the formula is hardcoded in the code at 
    # PipelineReportService.compute_aggregate_scores. I'm commenting out the code below since
    # the model TaxonScoringModel.rb no longer exists so this would fail.

    # tsm = TaxonScoringModel.new(name: 'aggregate_score')
    # tsm.model_json = '
# {
#   "op" : "+",
#   "on" : [
#     {
#       "op": "*",
#       "on": [
#         {
#           "op": "abs",
#           "on": { "op": "attr", "on": "genus.NT.zscore" }
#         },
#         { "op": "attr", "on": "species.NT.zscore" },
#         { "op": "attr", "on": "species.NT.rpm" }
#       ]
#     },
#     {
#       "op": "*",
#       "on": [
#         {
#           "op": "abs",
#           "on": { "op": "attr", "on": "genus.NR.zscore" }
#         },
#         { "op": "attr", "on": "species.NR.zscore" },
#         { "op": "attr", "on": "species.NR.rpm" }
#       ]
#     }
#   ]
# }'
    # tsm.save
  end
end
