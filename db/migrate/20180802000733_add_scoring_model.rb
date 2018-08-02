class AddScoringModel < ActiveRecord::Migration[5.1]
  def change
    tsm = TaxonScoringModel.new(name: 'aggregate_score')
    tsm.model_json = '
{
  "op" : "+",
  "on" : [
    {
      "op": "*",
      "on": [
        {
          "op": "abs",
          "on": { "op": "attr", "on": "genus.NT.Z" }
        },
        { "op": "attr", "on": "species.NT.Z" },
        { "op": "attr", "on": "species.NT.rpm" }
      ]
    },
    {
      "op": "*",
      "on": [
        {
          "op": "abs",
          "on": { "op": "attr", "on": "genus.NR.Z" }
        },
        { "op": "attr", "on": "species.NR.Z" },
        { "op": "attr", "on": "species.NR.rpm" }
      ]
    }
  ]
}'
    tsm.save
  end
end
