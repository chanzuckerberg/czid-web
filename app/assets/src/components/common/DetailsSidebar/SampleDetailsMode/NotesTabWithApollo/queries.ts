import { gql } from "@apollo/client";

export const GET_SAMPLE_NOTES = gql`
  query GetSample($sampleId: Int!) {
    sample(sampleId: $sampleId) {
      id
      name
      sampleNotes
    }
  }
`;
