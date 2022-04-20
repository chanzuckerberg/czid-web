# frozen_string_literal: true

class AddFakeSampleTypeToSampleTypes < ActiveRecord::Migration[6.1]
  def up
    SampleType.create(name: "Fake Sample Type", group: "Other")
  end

  def down
    SampleType.find_by(name: "Fake Sample Type").destroy
  end
end
