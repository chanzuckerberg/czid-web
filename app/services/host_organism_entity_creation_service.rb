class HostOrganismEntityCreationService
  include Callable
  CreateHostOrganismMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
        mutation($name: String!, $collection_id: Int!, $category: HostOrganismCategory!) {
            createHostOrganism(
                input: {name: $name, version: "1", category: $category, isDeuterostome: false, collectionId: $collection_id}
            ) {
                id
            }
        }
  GRAPHQL

  def initialize(user_id, project_id, host_genome_names)
    @user_id = user_id
    @project_id = project_id
    @host_genome_names = host_genome_names
  end

  def call
    @host_genome_names.each do |name|
      response = CzidGraphqlFederation.query_with_token(@user_id, CreateHostOrganismMutation, variables: { name: name, collection_id: @project_id, category: "unknown" })
      ## TODO: perform error checking
      if (data = response.data)
        Rails.logger.info("CreateHostOrganismMutation response: #{data}")
      end
    end
  end
end
