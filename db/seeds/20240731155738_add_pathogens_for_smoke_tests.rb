class AddPathogensForSmokeTests < SeedMigration::Migration
  def up
    # Use correct tax_id for Betacoronavirus
    Pathogen.find_by(tax_id: 694002).update(tax_id: 694003)

    # Klebsiella pneumoniae
    klebsiella = Pathogen.create(tax_id: 573)

    # Escherichia coli
    ecoli = Pathogen.create(tax_id: 562)

    # Streptococcus mitis
    strep = Pathogen.create(tax_id: 28037)

    # Human mastadenovirus B
    mastadenovirus = Pathogen.create(tax_id: 108098)

    # Ralstonia pickettii
    ralstonia = Pathogen.create(tax_id: 329)

    # Add to current pathogen list
    current_pathogen_list_version = "1.0.0"
    pathogen_list = PathogenListVersion.find_by(version: current_pathogen_list_version)
    pathogen_list.pathogens << [klebsiella, ecoli, strep, mastadenovirus, ralstonia]
  end

  def down
    Pathogen.find_by(tax_id: 694003).update(tax_id: 694002)
    Pathogen.find_by(tax_id: 573).destroy
    Pathogen.find_by(tax_id: 562).destroy
    Pathogen.find_by(tax_id: 28037).destroy
    Pathogen.find_by(tax_id: 108098).destroy
    Pathogen.find_by(tax_id: 329).destroy
  end
end
