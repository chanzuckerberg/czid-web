import { BlastMethods } from "./constants";

// Sequences should be passed in as a string, non-encoded
export const prepareBlastQuery = ({ sequences, program = "blastn" }) => {
  const database = determineDatabaseForBlast(program);

  const baseUrl = "https://blast.ncbi.nlm.nih.gov/Blast.cgi?";
  const encodedSequences = encodeURI(sequences);
  const queryParams = `CMD=PUT&DATABASE=${database}&PROGRAM=${program}&QUERY=${encodedSequences}`;

  return baseUrl + queryParams;
};

const determineDatabaseForBlast = blastMethod => {
  switch (blastMethod) {
    case BlastMethods.BlastN:
      return "nt";
    case BlastMethods.BlastX:
      return "nr";
  }
};
