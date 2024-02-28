/**
 * @generated SignedSource<<b64a618c8813ec21fd5868c378cc792a>>
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
  offset?: number | null | undefined;
  orderBy?: queryInput_fedSequencingReads_input_orderBy_Input | null | undefined;
  todoRemove?: queryInput_fedSequencingReads_input_todoRemove_Input | null | undefined;
  where?: queryInput_fedSequencingReads_input_where_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_Input = {
  id?: queryInput_fedSequencingReads_input_where_id_Input | null | undefined;
};
export type queryInput_fedSequencingReads_input_where_id_Input = {
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
export type DiscoveryViewFCSequencingReadsQuery$variables = {
  input?: queryInput_fedSequencingReads_input_Input | null | undefined;
};
export type DiscoveryViewFCSequencingReadsQuery$data = {
  readonly fedSequencingReads: ReadonlyArray<{
    readonly consensusGenomes: {
      readonly edges: ReadonlyArray<{
        readonly node: {
          readonly metrics: {
            readonly coverageDepth: number | null | undefined;
            readonly gcPercent: number | null | undefined;
            readonly nActg: number | null | undefined;
            readonly nAmbiguous: number | null | undefined;
            readonly nMissing: number | null | undefined;
            readonly percentGenomeCalled: number | null | undefined;
            readonly percentIdentity: number | null | undefined;
            readonly refSnps: number | null | undefined;
            readonly referenceGenomeLength: number | null | undefined;
            readonly totalReads: number | null | undefined;
          } | null | undefined;
          readonly producingRunId: string | null | undefined;
          readonly referenceGenome: {
            readonly accessionId: string | null | undefined;
            readonly accessionName: string | null | undefined;
          } | null | undefined;
          readonly taxon: {
            readonly name: string;
          } | null | undefined;
        };
      } | null | undefined>;
    };
    readonly id: string;
    readonly medakaModel: string | null | undefined;
    readonly nucleicAcid: string;
    readonly protocol: string | null | undefined;
    readonly sample: {
      readonly collection: {
        readonly name: string | null | undefined;
        readonly public: boolean | null | undefined;
      } | null | undefined;
      readonly collectionLocation: string;
      readonly hostOrganism: {
        readonly name: string;
      } | null | undefined;
      readonly metadatas: {
        readonly edges: ReadonlyArray<{
          readonly node: {
            readonly fieldName: string;
            readonly value: string;
          };
        } | null | undefined>;
      };
      readonly name: string;
      readonly notes: string | null | undefined;
      readonly ownerUserId: number | null | undefined;
      readonly ownerUserName: string | null | undefined;
      readonly railsSampleId: number | null | undefined;
      readonly sampleType: string;
      readonly uploadError: string | null | undefined;
      readonly waterControl: boolean | null | undefined;
    } | null | undefined;
    readonly taxon: {
      readonly name: string;
    } | null | undefined;
    readonly technology: string;
  } | null | undefined> | null | undefined;
};
export type DiscoveryViewFCSequencingReadsQuery = {
  response: DiscoveryViewFCSequencingReadsQuery$data;
  variables: DiscoveryViewFCSequencingReadsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = [
  (v1/*: any*/)
],
v3 = [
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
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "nucleicAcid",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "protocol",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "medakaModel",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "technology",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedSequencingReads_items_taxon",
        "kind": "LinkedField",
        "name": "taxon",
        "plural": false,
        "selections": (v2/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedSequencingReads_items_sample",
        "kind": "LinkedField",
        "name": "sample",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "railsSampleId",
            "storageKey": null
          },
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "notes",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "collectionLocation",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "sampleType",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "waterControl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "uploadError",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedSequencingReads_items_sample_hostOrganism",
            "kind": "LinkedField",
            "name": "hostOrganism",
            "plural": false,
            "selections": (v2/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedSequencingReads_items_sample_collection",
            "kind": "LinkedField",
            "name": "collection",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "public",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "ownerUserId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "ownerUserName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedSequencingReads_items_sample_metadatas",
            "kind": "LinkedField",
            "name": "metadatas",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "query_fedSequencingReads_items_sample_metadatas_edges_items",
                "kind": "LinkedField",
                "name": "edges",
                "plural": true,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "query_fedSequencingReads_items_sample_metadatas_edges_items_node",
                    "kind": "LinkedField",
                    "name": "node",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "fieldName",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "value",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_fedSequencingReads_items_consensusGenomes",
        "kind": "LinkedField",
        "name": "consensusGenomes",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "query_fedSequencingReads_items_consensusGenomes_edges_items",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "query_fedSequencingReads_items_consensusGenomes_edges_items_node",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "producingRunId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "query_fedSequencingReads_items_consensusGenomes_edges_items_node_taxon",
                    "kind": "LinkedField",
                    "name": "taxon",
                    "plural": false,
                    "selections": (v2/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "query_fedSequencingReads_items_consensusGenomes_edges_items_node_referenceGenome",
                    "kind": "LinkedField",
                    "name": "referenceGenome",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "accessionId",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "accessionName",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "query_fedSequencingReads_items_consensusGenomes_edges_items_node_metrics",
                    "kind": "LinkedField",
                    "name": "metrics",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "coverageDepth",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "totalReads",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "gcPercent",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "refSnps",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "percentIdentity",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "nActg",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "percentGenomeCalled",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "nMissing",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "nAmbiguous",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "referenceGenomeLength",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
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
    "name": "DiscoveryViewFCSequencingReadsQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DiscoveryViewFCSequencingReadsQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "59e05731e96363ff329489a1a8cca568",
    "id": null,
    "metadata": {},
    "name": "DiscoveryViewFCSequencingReadsQuery",
    "operationKind": "query",
    "text": "query DiscoveryViewFCSequencingReadsQuery(\n  $input: queryInput_fedSequencingReads_input_Input\n) {\n  fedSequencingReads(input: $input) {\n    id\n    nucleicAcid\n    protocol\n    medakaModel\n    technology\n    taxon {\n      name\n    }\n    sample {\n      railsSampleId\n      name\n      notes\n      collectionLocation\n      sampleType\n      waterControl\n      uploadError\n      hostOrganism {\n        name\n      }\n      collection {\n        name\n        public\n      }\n      ownerUserId\n      ownerUserName\n      metadatas {\n        edges {\n          node {\n            fieldName\n            value\n          }\n        }\n      }\n    }\n    consensusGenomes {\n      edges {\n        node {\n          producingRunId\n          taxon {\n            name\n          }\n          referenceGenome {\n            accessionId\n            accessionName\n          }\n          metrics {\n            coverageDepth\n            totalReads\n            gcPercent\n            refSnps\n            percentIdentity\n            nActg\n            percentGenomeCalled\n            nMissing\n            nAmbiguous\n            referenceGenomeLength\n          }\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b729aedfb50e8ae8a837173102396c23";

export default node;
