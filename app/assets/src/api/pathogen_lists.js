import { gql, useQuery } from "@apollo/client";

const GET_PATHOGEN_LIST = gql`
  query GetPathogenList {
    pathogenList {
      version
      citations
      updatedAt
      pathogens {
        category
        name
        taxId
      }
    }
  }
`;

const usePathogenList = () => {
  const { loading, error, data } = useQuery(GET_PATHOGEN_LIST);
  return { loading, error, data };
};

export { usePathogenList };
