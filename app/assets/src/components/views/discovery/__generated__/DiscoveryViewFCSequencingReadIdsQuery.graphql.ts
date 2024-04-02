/**
 * @generated SignedSource<<5e8901cf6afa095f6cf3753401a5fffe>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type queryInput_fedSequencingReads_input_Input = {
  consensusGenomesInput?: queryInput_fedSequencingReads_input_consensusGenomesInput_Input | null | undefined;
  limit?: number | null | undefined;
  limitOffset?: queryInput_fedSequencingReads_input_limitOffset_Input | null | undefined;
  offset?: number | null | undefined;
  orderBy?: queryInput_fedSequencingReads_input_orderBy_Input | null | undefined;
  orderByArray?: ReadonlyArray<queryInput_fedSequencingReads_input_orderByArray_items_Input | null | undefined> | null | undefined;
  todoRemove?: queryInput_fedSequencingReads_input_todoRemove_Input | null | undefined;
  where?: queryInput_fedSequencingReads_input_where_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_limitOffset_Input = {
  limit?: number | null | undefined;
  offset?: number | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_Input = {
  collectionId?: queryInput_fedSequencingReads_input_where_collectionId_Input | null | undefined;
  consensusGenomes?: queryInput_fedSequencingReads_input_where_consensusGenomes_Input | null | undefined;
  id?: queryInput_fedSequencingReads_input_where_id_Input | null | undefined;
  sample?: queryInput_fedSequencingReads_input_where_sample_Input | null | undefined;
  taxon?: queryInput_fedSequencingReads_input_where_taxon_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_id_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_collectionId_Input = {
  _in?: ReadonlyArray<number | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_sample_Input = {
  collectionLocation?: queryInput_fedSequencingReads_input_where_sample_collectionLocation_Input | null | undefined;
  hostOrganism?: queryInput_fedSequencingReads_input_where_sample_hostOrganism_Input | null | undefined;
  name?: queryInput_fedSequencingReads_input_where_sample_name_Input | null | undefined;
  sampleType?: queryInput_fedSequencingReads_input_where_sample_sampleType_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_sample_name_Input = {
  _iregex?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_sample_collectionLocation_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_sample_hostOrganism_Input = {
  name?: queryInput_fedSequencingReads_input_where_sample_hostOrganism_name_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_sample_hostOrganism_name_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_sample_sampleType_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_taxon_Input = {
  name?: queryInput_fedSequencingReads_input_where_taxon_name_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_taxon_name_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_consensusGenomes_Input = {
  producingRunId?: queryInput_fedSequencingReads_input_where_consensusGenomes_producingRunId_Input | null | undefined;
  taxon?: queryInput_fedSequencingReads_input_where_consensusGenomes_taxon_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_consensusGenomes_producingRunId_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_consensusGenomes_taxon_Input = {
  name?: queryInput_fedSequencingReads_input_where_consensusGenomes_taxon_name_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_consensusGenomes_taxon_name_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderBy_Input = {
  medakaModel?: string | null | undefined;
  nucleicAcid?: string | null | undefined;
  protocol?: string | null | undefined;
  sample?: queryInput_fedSequencingReads_input_orderBy_sample_Input | null | undefined;
  technology?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderBy_sample_Input = {
  collectionLocation?: string | null | undefined;
  hostOrganism?: queryInput_fedSequencingReads_input_orderBy_sample_hostOrganism_Input | null | undefined;
  metadata?: queryInput_fedSequencingReads_input_orderBy_sample_metadata_Input | null | undefined;
  name?: string | null | undefined;
  notes?: string | null | undefined;
  sampleType?: string | null | undefined;
  waterControl?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderBy_sample_hostOrganism_Input = {
  name?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderBy_sample_metadata_Input = {
  dir?: string | null | undefined;
  fieldName?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderByArray_items_Input = {
  medakaModel?: string | null | undefined;
  nucleicAcid?: string | null | undefined;
  protocol?: string | null | undefined;
  sample?: queryInput_fedSequencingReads_input_orderByArray_items_sample_Input | null | undefined;
  technology?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderByArray_items_sample_Input = {
  collectionLocation?: string | null | undefined;
  hostOrganism?: queryInput_fedSequencingReads_input_orderByArray_items_sample_hostOrganism_Input | null | undefined;
  metadata?: queryInput_fedSequencingReads_input_orderByArray_items_sample_metadata_Input | null | undefined;
  name?: string | null | undefined;
  notes?: string | null | undefined;
  sampleType?: string | null | undefined;
  waterControl?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderByArray_items_sample_hostOrganism_Input = {
  name?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_orderByArray_items_sample_metadata_Input = {
  dir?: string | null | undefined;
  fieldName?: string | null | undefined;
};
export type queryInput_fedSequencingReads_input_consensusGenomesInput_Input = {
  where?: queryInput_fedSequencingReads_input_consensusGenomesInput_where_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_consensusGenomesInput_where_Input = {
  producingRunId?: queryInput_fedSequencingReads_input_consensusGenomesInput_where_producingRunId_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_consensusGenomesInput_where_producingRunId_Input = {
  _in?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type queryInput_fedSequencingReads_input_todoRemove_Input = {
  domain?: string | null | undefined;
  host?: ReadonlyArray<number | null | undefined> | null | undefined;
  locationV2?: ReadonlyArray<string | null | undefined> | null | undefined;
  orderBy?: string | null | undefined;
  orderDir?: string | null | undefined;
  projectId?: string | null | undefined;
  search?: string | null | undefined;
  taxaLevels?: ReadonlyArray<string | null | undefined> | null | undefined;
  taxons?: ReadonlyArray<number | null | undefined> | null | undefined;
  time?: ReadonlyArray<string | null | undefined> | null | undefined;
  tissue?: ReadonlyArray<string | null | undefined> | null | undefined;
  visibility?: string | null | undefined;
  workflow?: string | null | undefined;
};
export type DiscoveryViewFCSequencingReadIdsQuery$variables = {
  input?: queryInput_fedSequencingReads_input_Input | null | undefined;
};
export type DiscoveryViewFCSequencingReadIdsQuery$data = {
  readonly fedSequencingReads: ReadonlyArray<{
    readonly id: string;
  } | null | undefined> | null | undefined;
};
export type DiscoveryViewFCSequencingReadIdsQuery = {
  response: DiscoveryViewFCSequencingReadIdsQuery$data;
  variables: DiscoveryViewFCSequencingReadIdsQuery$variables;
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
    "concreteType": "query_fedSequencingReads_items",
    "kind": "LinkedField",
    "name": "fedSequencingReads",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
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
    "name": "DiscoveryViewFCSequencingReadIdsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DiscoveryViewFCSequencingReadIdsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "fd51764199c1fe5635fb0efa2a7eee79",
    "id": null,
    "metadata": {},
    "name": "DiscoveryViewFCSequencingReadIdsQuery",
    "operationKind": "query",
    "text": "query DiscoveryViewFCSequencingReadIdsQuery(\n  $input: queryInput_fedSequencingReads_input_Input\n) {\n  fedSequencingReads(input: $input) {\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "132411c6c4e82b0d714a46551943fad6";

export default node;
