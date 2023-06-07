import { gql } from "@apollo/client";

export const GET_TAXON_DESCRIPTION = gql`
  query TaxonDescription($taxonIdList: [Int!]) {
    taxonDescription(taxonIdList: $taxonIdList) {
      summary
      taxId
      title
      wikiUrl
    }
  }
`;

export const GET_TAXON_DISTRIBUTION = gql`
  query TaxonDescription($backgroundId: Int!, $taxId: Int!) {
    taxonDist(backgroundId: $backgroundId, taxId: $taxId) {
      mergedNtNr {
        mean
        rpmList
        stdev
        taxLevel
      }
      nr {
        taxLevel
        mean
        stdev
        rpmList
      }
      nt {
        taxLevel
        mean
        stdev
        rpmList
      }
    }
  }
`;
