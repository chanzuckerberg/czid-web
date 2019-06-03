FactoryBot.define do
  factory :host_genome, class: HostGenome do
    sequence (:name) { |n| "Host #{n}" }
  end
end