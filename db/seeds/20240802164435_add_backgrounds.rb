class AddBackgrounds < SeedMigration::Migration
  def up
    bg = Background.new(
      name: "NID human CSF HC",
      description: nil,
      public_access: 1,
      ready: 1,
      user_id: nil,
      mass_normalized: false
    )
    bg.save(validate: false)

    bg = Background.new(
      name: "NID Human CSF v3",
      description: nil,
      public_access: 1,
      ready: 1,
      user_id: nil,
      mass_normalized: false
    )
    bg.save(validate: false)

    bg = Background.new(
      name: "test mass normalized bg default",
      description: nil,
      public_access: 1,
      ready: 1,
      user_id: nil,
      mass_normalized: true
    )
    bg.save(validate: false)
  end

  def down
    Background.where(name: "NID human CSF HC").first.destroy
    Background.where(name: "NID Human CSF v3").first.destroy
    Background.where(name: "test mass normalized bg default").first.destroy
  end
end
