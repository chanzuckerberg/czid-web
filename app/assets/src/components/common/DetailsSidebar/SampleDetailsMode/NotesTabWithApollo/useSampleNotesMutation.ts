import { useMutation } from "@apollo/client";
import { getCsrfToken } from "~/api/utils";
import { graphql } from "~/gql/generated/gql";
import { federationClient } from "~/index";

const UPDATE_SAMPLE_NOTES = graphql(`
  mutation UpdateSampleNotes(
    $sampleId: Int!
    $value: String!
    $authenticityToken: String!
  ) {
    updateSampleNotes(
      sampleId: $sampleId
      value: $value
      authenticityToken: $authenticityToken
    ) {
      sample {
        sampleNotes
        id
      }
      status
      message
      errors
    }
  }
`);

export default function useNotesMutation() {
  const [updateNotes, { loading, error }] = useMutation(UPDATE_SAMPLE_NOTES, {
    // TODO: (smccanny): delete this once rails and graphql are integrated under a single client
    client: federationClient,
  });
  const updateSampleNotes = (sampleId: number, value: string) => {
    return updateNotes({
      variables: {
        sampleId,
        value,
        authenticityToken: getCsrfToken(),
      },
    });
  };
  return { updateSampleNotes, isSavePending: loading, isSaveError: error };
}
