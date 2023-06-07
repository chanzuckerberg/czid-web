/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import * as types from "./graphql";

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  "\n  query GetSample($sampleId: Int!) {\n    sample(sampleId: $sampleId) {\n      id\n      name\n      sampleNotes\n    }\n  }\n":
    types.GetSampleDocument,
  "\n  mutation UpdateSampleNotes(\n    $sampleId: Int!\n    $value: String!\n    $authenticityToken: String!\n  ) {\n    updateSampleNotes(\n      sampleId: $sampleId\n      value: $value\n      authenticityToken: $authenticityToken\n    ) {\n      sample {\n        sampleNotes\n        id\n      }\n      message\n      errors\n    }\n  }\n":
    types.UpdateSampleNotesDocument,
  "\n  query TaxonDescription($taxonIdList: [Int!]) {\n    taxonDescription(taxonIdList: $taxonIdList) {\n      summary\n      taxId\n      title\n      wikiUrl\n    }\n  }\n":
    types.TaxonDescriptionDocument,
  "\n  query TaxonDistribution($backgroundId: Int!, $taxId: Int!) {\n    taxonDist(backgroundId: $backgroundId, taxId: $taxId) {\n      mergedNtNr {\n        mean\n        rpmList\n        stdev\n        taxLevel\n      }\n      nr {\n        taxLevel\n        mean\n        stdev\n        rpmList\n      }\n      nt {\n        taxLevel\n        mean\n        stdev\n        rpmList\n      }\n    }\n  }\n":
    types.TaxonDistributionDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query GetSample($sampleId: Int!) {\n    sample(sampleId: $sampleId) {\n      id\n      name\n      sampleNotes\n    }\n  }\n",
): (typeof documents)["\n  query GetSample($sampleId: Int!) {\n    sample(sampleId: $sampleId) {\n      id\n      name\n      sampleNotes\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  mutation UpdateSampleNotes(\n    $sampleId: Int!\n    $value: String!\n    $authenticityToken: String!\n  ) {\n    updateSampleNotes(\n      sampleId: $sampleId\n      value: $value\n      authenticityToken: $authenticityToken\n    ) {\n      sample {\n        sampleNotes\n        id\n      }\n      message\n      errors\n    }\n  }\n",
): (typeof documents)["\n  mutation UpdateSampleNotes(\n    $sampleId: Int!\n    $value: String!\n    $authenticityToken: String!\n  ) {\n    updateSampleNotes(\n      sampleId: $sampleId\n      value: $value\n      authenticityToken: $authenticityToken\n    ) {\n      sample {\n        sampleNotes\n        id\n      }\n      message\n      errors\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query TaxonDescription($taxonIdList: [Int!]) {\n    taxonDescription(taxonIdList: $taxonIdList) {\n      summary\n      taxId\n      title\n      wikiUrl\n    }\n  }\n",
): (typeof documents)["\n  query TaxonDescription($taxonIdList: [Int!]) {\n    taxonDescription(taxonIdList: $taxonIdList) {\n      summary\n      taxId\n      title\n      wikiUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: "\n  query TaxonDistribution($backgroundId: Int!, $taxId: Int!) {\n    taxonDist(backgroundId: $backgroundId, taxId: $taxId) {\n      mergedNtNr {\n        mean\n        rpmList\n        stdev\n        taxLevel\n      }\n      nr {\n        taxLevel\n        mean\n        stdev\n        rpmList\n      }\n      nt {\n        taxLevel\n        mean\n        stdev\n        rpmList\n      }\n    }\n  }\n",
): (typeof documents)["\n  query TaxonDistribution($backgroundId: Int!, $taxId: Int!) {\n    taxonDist(backgroundId: $backgroundId, taxId: $taxId) {\n      mergedNtNr {\n        mean\n        rpmList\n        stdev\n        taxLevel\n      }\n      nr {\n        taxLevel\n        mean\n        stdev\n        rpmList\n      }\n      nt {\n        taxLevel\n        mean\n        stdev\n        rpmList\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
