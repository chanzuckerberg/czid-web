import { gql } from "@apollo/client";

const GET_PROJECTS_QUERY = gql`
  query GetProjects($projectId: Int!) {
    project(id: $projectId) {
      id
      name
      description
      publicAccess
      createdAt
      totalSampleCount
      creator {
        id
      }
    }
  }
`;

export { GET_PROJECTS_QUERY };
