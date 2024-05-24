/**
 * @generated SignedSource<<ceba0df964fd9489f748878d934a69c4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type queryInput_fedConsensusGenomes_input_Input = {
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  orderBy?: ReadonlyArray<queryInput_fedConsensusGenomes_input_orderBy_items_Input | null | undefined> | null | undefined;
  todoRemove?: queryInput_fedConsensusGenomes_input_todoRemove_Input | null | undefined;
  where?: queryInput_fedConsensusGenomes_input_where_Input | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_where_Input = {
  collectionId?: queryInput_fedConsensusGenomes_input_where_collectionId_Input | null | undefined;
  producingRunId?: queryInput_fedConsensusGenomes_input_where_producingRunId_Input | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_where_collectionId_Input = {
  _in?: ReadonlyArray<number | null | undefined> | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_where_producingRunId_Input = {
  _eq?: string | null | undefined;
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_orderBy_items_Input = {
  accession?: queryInput_fedConsensusGenomes_input_orderBy_items_accession_Input | null | undefined;
  metrics?: queryInput_fedConsensusGenomes_input_orderBy_items_metrics_Input | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_orderBy_items_accession_Input = {
  accessionId?: string | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_orderBy_items_metrics_Input = {
  coverageDepth?: string | null | undefined;
  gcPercent?: string | null | undefined;
  nActg?: string | null | undefined;
  nAmbiguous?: string | null | undefined;
  nMissing?: string | null | undefined;
  percentGenomeCalled?: string | null | undefined;
  percentIdentity?: string | null | undefined;
  refSnps?: string | null | undefined;
  referenceGenomeLength?: string | null | undefined;
  totalReads?: string | null | undefined;
};
export type queryInput_fedConsensusGenomes_input_todoRemove_Input = {
  domain?: string | null | undefined;
  host?: ReadonlyArray<number | null | undefined> | null | undefined;
  locationV2?: ReadonlyArray<string | null | undefined> | null | undefined;
  orderBy?: string | null | undefined;
  orderDir?: string | null | undefined;
  projectId?: string | null | undefined;
  sampleIds?: ReadonlyArray<number | null | undefined> | null | undefined;
  search?: string | null | undefined;
  taxaLevels?: ReadonlyArray<string | null | undefined> | null | undefined;
  taxons?: ReadonlyArray<number | null | undefined> | null | undefined;
  time?: ReadonlyArray<string | null | undefined> | null | undefined;
  tissue?: ReadonlyArray<string | null | undefined> | null | undefined;
  visibility?: string | null | undefined;
  workflow?: string | null | undefined;
  workflowRunIds?: ReadonlyArray<number | null | undefined> | null | undefined;
};
export type DiscoveryViewFCConsensusGenomeIdsQuery$variables = {
  input?: queryInput_fedConsensusGenomes_input_Input | null | undefined;
};
export type DiscoveryViewFCConsensusGenomeIdsQuery$data = {
  readonly fedConsensusGenomes: ReadonlyArray<{
    readonly producingRunId: string | null | undefined;
  } | null | undefined> | null | undefined;
};
export type DiscoveryViewFCConsensusGenomeIdsQuery = {
  response: DiscoveryViewFCConsensusGenomeIdsQuery$data;
  variables: DiscoveryViewFCConsensusGenomeIdsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "query_fedConsensusGenomes_items",
    "kind": "LinkedField",
    "name": "fedConsensusGenomes",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "producingRunId",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "DiscoveryViewFCConsensusGenomeIdsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DiscoveryViewFCConsensusGenomeIdsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c534b9a56e238d2c39e8290c056ec60a",
    "id": null,
    "metadata": {},
    "name": "DiscoveryViewFCConsensusGenomeIdsQuery",
    "operationKind": "query",
    "text": "query DiscoveryViewFCConsensusGenomeIdsQuery(\n  $input: queryInput_fedConsensusGenomes_input_Input\n) {\n  fedConsensusGenomes(input: $input) {\n    producingRunId\n  }\n}\n"
  }
};
})();

(node as any).hash = "509c2aea540ea9c767ebf529a62a0200";

export default node;
