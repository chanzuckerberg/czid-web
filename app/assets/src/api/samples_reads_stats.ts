import { gql } from "@apollo/client";

const GET_SAMPLES_READS_STATS_QUERY = gql`
  query GetSamplesReadStats($sampleIds: [Int!]!) {
    sampleReadsStats(sampleIds: $sampleIds) {
      sampleReadsStats {
        sampleId
        initialReads
        name
        pipelineVersion
        sampleId
        wdlVersion
        steps {
          name
          readsAfter
        }
      }
    }
  }
`;

export { GET_SAMPLES_READS_STATS_QUERY };
