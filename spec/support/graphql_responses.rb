module GraphqlResponses
  def graphql_response_obj(data:)
    JSON.parse({
      "data": data,
    }.to_json, object_class: OpenStruct)
  end
end
