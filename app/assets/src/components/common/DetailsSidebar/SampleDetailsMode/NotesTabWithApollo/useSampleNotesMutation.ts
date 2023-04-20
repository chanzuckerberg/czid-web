import { gql, useMutation } from "@apollo/client";
import { getCsrfToken } from "~/api/utils";

const UPDATE_SAMPLE_NOTES = gql`
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
      data {
        sampleNotes
        id
      }
      status
      message
      errors
    }
  }
`;

export default function useNotesMutation() {
  const [updateNotes, { loading, error }] = useMutation(UPDATE_SAMPLE_NOTES);
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
