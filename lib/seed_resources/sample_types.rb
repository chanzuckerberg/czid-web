require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class SampleTypes < Base
    def seed
      ########################################################
      # From migration 20200108180542_create_sample_types.rb #
      ########################################################
      FactoryBot.find_or_create(
        :sample_type,
        name: "Plasma",
        group: "Systemic Inflammation",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Serum",
        group: "Systemic Inflammation",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Whole Blood",
        group: "Systemic Inflammation",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Brain",
        group: "Central Nervous System",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Cerebrospinal Fluid",
        group: "Central Nervous System",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "CNS Tissue",
        group: "Central Nervous System",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Ocular Fluid",
        group: "Central Nervous System",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Lung",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Bronchoalveolar Lavage",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Nasopharyngeal Swab",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Mini Bronchoalveolar Lavage",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Oralpharyngeal Swab",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Saliva",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Sputum",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Tracheal Aspirate",
        group: "Respiratory Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Amniotic Fluid",
        group: "Reproductive Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Placenta",
        group: "Reproductive Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Cervicovaginal Swab",
        group: "Reproductive Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Uterus",
        group: "Reproductive Tract",
        insect_only: false,
        human_only: true
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Stool",
        group: "Excrement",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Urine",
        group: "Excrement",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Heart",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Intestines",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Kidney",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Liver",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Muscle",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Stomach",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Bladder",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Thyroid",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Skin",
        group: "Organs",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Abdomen",
        group: "Insect Body Parts",
        insect_only: true,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Gaster",
        group: "Insect Body Parts",
        insect_only: true,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Guts",
        group: "Insect Body Parts",
        insect_only: true,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Head",
        group: "Insect Body Parts",
        insect_only: true,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Whole Body",
        group: "Insect Body Parts",
        insect_only: true,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Salivary Gland",
        group: "Insect Body Parts",
        insect_only: true,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Mixed Tissue",
        group: "Other",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Simulation",
        group: "Other",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Cell Line",
        group: "Other",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Cultured Isolate",
        group: "Other",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Unknown",
        group: "Other",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Tumor",
        group: "Other",
        insect_only: false,
        human_only: false
      )

      FactoryBot.find_or_create(
        :sample_type,
        name: "Environmental",
        group: "Other",
        insect_only: false,
        human_only: false
      )
    end
  end
end
