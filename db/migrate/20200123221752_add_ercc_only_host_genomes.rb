# This adds a bunch of hosts which users are known to have taken samples from.
# They initially default to have ERCCs only subtracted.
# See https://czi.quip.com/yPgpAPj1dtEC/Hosts-Dropdown-Options
class AddErccOnlyHostGenomes < ActiveRecord::Migration[5.1]
  HOST_GENOME_NAMES = [
    'Badger',
    'Bank Vole',
    'Bat',
    'Batfish',
    'Bear',
    'Bee',
    'Carp',
    'Cat',
    'Camel',
    'Chimpanzee',
    'Cow',
    'Dik Dik',
    'Dog',
    'Donkey',
    'Chicken',
    'Ferret',
    'Field Vole',
    'Fox',
    'Giraffe',
    'Goat',
    'Gorilla',
    'Guinea Pig',
    'Harbor Seal',
    'Hedgehog',
    'Horse',
    'Human',
    'Kestrel',
    'Leopard',
    'Lion',
    'Llama',
    'Mallard',
    'Milu',
    'Monk Seal',
    'Monkey',
    'Mosquito',
    'Mouse',
    'Owl',
    'Penguin',
    'Pig',
    'Porpoise',
    'Prairie Dog',
    'Raccoon',
    'Rabbit',
    'Rat',
    'Sea Lion',
    'Seagull',
    'Seal',
    'Seastar',
    'Sloth',
    'Snake',
    'Stork',
    'Taurine Cattle',
    'Tick',
    'Tiger',
    'Turkey',
    'Unknown',
    'Water Buffalo',
  ].freeze

  def up
    HOST_GENOME_NAMES.each { |name| add(name) }
  end

  def down
    # This should never delete good data because of foreign keys
    HOST_GENOME_NAMES.each do |name|
      hg = HostGenome.find_by(name: name)
      hg.destroy! if hg
    end
  end

  private

  # Adapted from app/lib/add_host_genome_migration_example.rb
  def add(name)
    return if HostGenome.find_by(name: name)

    hg = HostGenome.new
    hg.name = name
    # This should not be necessary but errors running migration in travis
    # were observed most likely because of dependence on new mysql defaults in
    # previous migration. See ChangeHostGenomeDefaults.
    hg.s3_star_index_path = HostGenome.s3_star_index_path_default
    hg.s3_bowtie2_index_path = HostGenome.s3_bowtie2_index_path_default
    hg.skip_deutero_filter = 0

    human_host = HostGenome.find_by(name: "Human")
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save!
  end
end
