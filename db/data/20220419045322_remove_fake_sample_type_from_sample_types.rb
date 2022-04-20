# frozen_string_literal: true

class RemoveFakeSampleTypeFromSampleTypes < ActiveRecord::Migration[6.1]
  def up
    SampleType.find_by(name: "Fake Sample Type").destroy
  end

  def down
    SampleType.create(name: "Fake Sample Type", group: "Other")
  end
end
