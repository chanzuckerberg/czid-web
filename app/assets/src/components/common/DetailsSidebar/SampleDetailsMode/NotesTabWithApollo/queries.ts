import { graphql } from "~/gql/generated/gql";

export const GET_SAMPLE_NOTES = graphql(`
  query GetSample($sampleId: Int!) {
    sample(sampleId: $sampleId) {
      id
      name
      sampleNotes
    }
  }
`);
