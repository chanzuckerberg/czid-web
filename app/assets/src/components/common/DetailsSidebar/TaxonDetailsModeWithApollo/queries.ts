import { graphql } from "~/gql/generated/gql";

export const GET_TAXON_DESCRIPTION = graphql(`
  query TaxonDescription($taxonIdList: [Int!]) {
    taxonDescription(taxonIdList: $taxonIdList) {
      summary
      taxId
      title
      wikiUrl
    }
  }
`);

// TODO: I get a type error if I try to remove mergedNtNr from the query
export const GET_TAXON_DISTRIBUTION = graphql(`
  query TaxonDistribution($backgroundId: Int!, $taxId: Int!) {
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
`);
