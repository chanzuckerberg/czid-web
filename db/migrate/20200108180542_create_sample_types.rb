class CreateSampleTypes < ActiveRecord::Migration[5.1]
  def up
    unless SampleType.table_exists?
      create_table :sample_types do |t|
        t.string 'name', null: false, comment: 'Canonical name of the sample type. This should be immutable after creation. It is used as a key to join with MetadataField sample_type values.'
        t.string 'group', null: false, comment: 'Mutually exclusive grouping of names. Example: "Organs".'
        t.boolean 'insect_only', null: false, default: false, comment: 'Whether a sample type should only be for insects.'
        t.boolean 'human_only', null: false, default: false, comment: 'Whether a sample type should only be for humans.'
        t.timestamps
      end
      add_index :sample_types, :name, unique: true
    end

    populate_sample_types!
  end

  # From "Sample Type Groupings" at
  # https://docs.google.com/spreadsheets/d/1_hPkQe5LI0Zw_C0Ls4HVCEDsc_FNNVOaU_aAfoaiZRE/
  def populate_sample_types!
    initial_data = {
      'Systemic Inflammation': [
        { name: 'Plasma' },
        { name: 'Serum' },
        { name: 'Whole Blood' },
      ],

      'CNS Infections': [
        { name: 'Brain' },
        { name: 'Cerebrospinal Fluid', human_only: true },
        { name: 'Central Nervous System' },
        { name: 'Ocular Fluid', human_only: true },
      ],

      'Respiratory Infections': [
        { name: 'Lung' },
        { name: 'Bronchoalveolar Lavage', human_only: true },
        { name: 'Nasopharyngeal Swab', human_only: true },
        { name: 'Mini Bronchoalveolar Lavage', human_only: true },
        { name: 'Oralpharyngeal Swab', human_only: true },
        { name: 'Saliva', human_only: true },
        { name: 'Sputum', human_only: true },
        { name: 'Tracheal Aspirate', human_only: true },
      ],

      'Reproductive': [
        { name: 'Amniotic Fluid', human_only: true },
        { name: 'Placenta', human_only: true },
        { name: 'Cervicovaginal Swab', human_only: true },
        { name: 'Uterus', human_only: true },
      ],

      'Excrement': [
        { name: 'Stool' },
        { name: 'Urine' },
      ],

      'Organs': [
        { name: 'Heart' },
        { name: 'Intestines' },
        { name: 'Kidney' },
        { name: 'Liver' },
        { name: 'Muscle' },
        { name: 'Stomach' },
        { name: 'Bladder' },
        { name: 'Thyroid' },
        { name: 'Skin' },
      ],

      'Insect Body Parts': [
        { name: 'Abdomen', insect_only: true },
        { name: 'Gaster', insect_only: true },
        { name: 'Guts', insect_only: true },
        { name: 'Head', insect_only: true },
        { name: 'Whole Body', insect_only: true },
        { name: 'Salivary Gland', insect_only: true },
      ],

      'Other': [
        { name: 'Mixed Tissue' },
        { name: 'Simulation' },
        { name: 'Cell Line' },
        { name: 'Cultured Isolate' },
        { name: 'Unknown' },
        { name: 'Tumo' },
      ],
    }
    initial_data.each do |group_name, group|
      group.each do |obj|
        SampleType.find_or_create_by!(
          group: group_name,
          name: obj[:name],
          human_only: obj[:human_only] || false,
          insect_only: obj[:insect_only] || false
        )
      end
    end
  end
end
