// Sequences should be passed in as a string, non-encoded
export const prepareBlastQuery = ({
  sequences,
  database = "nt",
  program = "blastn",
}) => {
  const baseUrl = "https://blast.ncbi.nlm.nih.gov/Blast.cgi?";
  const encodedSequences = encodeURI(sequences);
  const queryParams = `CMD=PUT&DATABASE=${database}&PROGRAM=${program}&QUERY=${encodedSequences}`;

  return baseUrl + queryParams;
};
