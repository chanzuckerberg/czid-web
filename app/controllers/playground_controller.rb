class PlaygroundController < ApplicationController
  before_action :login_required
  before_action :authenticate_user!
  before_action :no_demo_user
  before_action :admin_required

  def controls
    @controls_data = {
      thresholdFilters: {
        targets: [
          { text: "Aggregate Score", value: "NT_aggregatescore" },
          { text: "NT Z Score", value: "NT_zscore" },
          { text: "NT rPM", value: "NT_rpm" },
          { text: "NT r (total reads)", value: "NT_r" },
          { text: "NT %id", value: "NT_percentidentity" },
          { text: "NT log(1/e)", value: "NT_neglogevalue" },
          { text: "NR Z Score", value: "NR_zscore" },
          { text: "NR r (total reads)", value: "NR_r" },
          { text: "NR rPM", value: "NR_rpm" },
          { text: "NR %id", value: "NR_percentidentity" },
          { text: "R log(1/e)", value: "NR_neglogevalue" }
        ],
        operators: [">=", "<="]
      }
    }
  end
end
