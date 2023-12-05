/**
 * @generated SignedSource<<587e93c72c69b4f7d544ea93b0664911>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Annotation = {
  name: string;
};
export type QualityControlQuery$variables = {
  annotations?: ReadonlyArray<Annotation> | null | undefined;
  basic?: boolean | null | undefined;
  domain?: string | null | undefined;
  hostIds?: ReadonlyArray<number> | null | undefined;
  limit?: number | null | undefined;
  listAllIds?: boolean | null | undefined;
  location?: string | null | undefined;
  locationV2?: ReadonlyArray<string> | null | undefined;
  offset?: number | null | undefined;
  orderBy?: string | null | undefined;
  orderDir?: string | null | undefined;
  projectId: number;
  requestedSampleIds?: ReadonlyArray<number> | null | undefined;
  sampleIds?: ReadonlyArray<number> | null | undefined;
  searchString?: string | null | undefined;
  taxIds?: ReadonlyArray<number> | null | undefined;
  taxLevels?: ReadonlyArray<string> | null | undefined;
  thresholdFilterInfo?: string | null | undefined;
  time?: ReadonlyArray<string> | null | undefined;
  tissue?: ReadonlyArray<string> | null | undefined;
  visibility?: ReadonlyArray<string> | null | undefined;
  workflow?: string | null | undefined;
};
export type QualityControlQuery$data = {
  readonly samplesList: {
    readonly samples: ReadonlyArray<{
      readonly details: {
        readonly dbSample: {
          readonly uploadError: string | null | undefined;
        } | null | undefined;
        readonly derivedSampleOutput: {
          readonly pipelineRun: {
            readonly totalReads: number | null | undefined;
          } | null | undefined;
          readonly summaryStats: {
            readonly compressionRatio: number | null | undefined;
            readonly insertSizeMean: number | null | undefined;
            readonly qcPercent: number | null | undefined;
          } | null | undefined;
        } | null | undefined;
        readonly mngsRunInfo: {
          readonly createdAt: any | null | undefined;
          readonly reportReady: boolean | null | undefined;
          readonly resultStatusDescription: string | null | undefined;
        } | null | undefined;
      };
      readonly id: string;
      readonly name: string;
    }>;
  };
};
export type QualityControlQuery = {
  response: QualityControlQuery$data;
  variables: QualityControlQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "annotations"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "basic"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "domain"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "hostIds"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "limit"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "listAllIds"
},
v6 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "location"
},
v7 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "locationV2"
},
v8 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "offset"
},
v9 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "orderBy"
},
v10 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "orderDir"
},
v11 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "projectId"
},
v12 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "requestedSampleIds"
},
v13 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sampleIds"
},
v14 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "searchString"
},
v15 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "taxIds"
},
v16 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "taxLevels"
},
v17 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "thresholdFilterInfo"
},
v18 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "time"
},
v19 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "tissue"
},
v20 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "visibility"
},
v21 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflow"
},
v22 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "annotations",
        "variableName": "annotations"
      },
      {
        "kind": "Variable",
        "name": "basic",
        "variableName": "basic"
      },
      {
        "kind": "Variable",
        "name": "domain",
        "variableName": "domain"
      },
      {
        "kind": "Variable",
        "name": "hostIds",
        "variableName": "hostIds"
      },
      {
        "kind": "Variable",
        "name": "limit",
        "variableName": "limit"
      },
      {
        "kind": "Variable",
        "name": "listAllIds",
        "variableName": "listAllIds"
      },
      {
        "kind": "Variable",
        "name": "location",
        "variableName": "location"
      },
      {
        "kind": "Variable",
        "name": "locationV2",
        "variableName": "locationV2"
      },
      {
        "kind": "Variable",
        "name": "offset",
        "variableName": "offset"
      },
      {
        "kind": "Variable",
        "name": "orderBy",
        "variableName": "orderBy"
      },
      {
        "kind": "Variable",
        "name": "orderDir",
        "variableName": "orderDir"
      },
      {
        "kind": "Variable",
        "name": "projectId",
        "variableName": "projectId"
      },
      {
        "kind": "Variable",
        "name": "requestedSampleIds",
        "variableName": "requestedSampleIds"
      },
      {
        "kind": "Variable",
        "name": "sampleIds",
        "variableName": "sampleIds"
      },
      {
        "kind": "Variable",
        "name": "searchString",
        "variableName": "searchString"
      },
      {
        "kind": "Variable",
        "name": "taxIds",
        "variableName": "taxIds"
      },
      {
        "kind": "Variable",
        "name": "taxLevels",
        "variableName": "taxLevels"
      },
      {
        "kind": "Variable",
        "name": "thresholdFilterInfo",
        "variableName": "thresholdFilterInfo"
      },
      {
        "kind": "Variable",
        "name": "time",
        "variableName": "time"
      },
      {
        "kind": "Variable",
        "name": "tissue",
        "variableName": "tissue"
      },
      {
        "kind": "Variable",
        "name": "visibility",
        "variableName": "visibility"
      },
      {
        "kind": "Variable",
        "name": "workflow",
        "variableName": "workflow"
      }
    ],
    "concreteType": "SampleList",
    "kind": "LinkedField",
    "name": "samplesList",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Sample",
        "kind": "LinkedField",
        "name": "samples",
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
            "name": "name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SampleDetails",
            "kind": "LinkedField",
            "name": "details",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "DbSample",
                "kind": "LinkedField",
                "name": "dbSample",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "uploadError",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "DerivedSampleOutput",
                "kind": "LinkedField",
                "name": "derivedSampleOutput",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "PipelineRun",
                    "kind": "LinkedField",
                    "name": "pipelineRun",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "totalReads",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "SampleSummaryStats",
                    "kind": "LinkedField",
                    "name": "summaryStats",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "compressionRatio",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "qcPercent",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "insertSizeMean",
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
                "concreteType": "MngsRunInfo",
                "kind": "LinkedField",
                "name": "mngsRunInfo",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "resultStatusDescription",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reportReady",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "createdAt",
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      (v8/*: any*/),
      (v9/*: any*/),
      (v10/*: any*/),
      (v11/*: any*/),
      (v12/*: any*/),
      (v13/*: any*/),
      (v14/*: any*/),
      (v15/*: any*/),
      (v16/*: any*/),
      (v17/*: any*/),
      (v18/*: any*/),
      (v19/*: any*/),
      (v20/*: any*/),
      (v21/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "QualityControlQuery",
    "selections": (v22/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v11/*: any*/),
      (v2/*: any*/),
      (v4/*: any*/),
      (v8/*: any*/),
      (v9/*: any*/),
      (v10/*: any*/),
      (v5/*: any*/),
      (v1/*: any*/),
      (v13/*: any*/),
      (v3/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      (v15/*: any*/),
      (v16/*: any*/),
      (v17/*: any*/),
      (v0/*: any*/),
      (v18/*: any*/),
      (v19/*: any*/),
      (v20/*: any*/),
      (v14/*: any*/),
      (v12/*: any*/),
      (v21/*: any*/)
    ],
    "kind": "Operation",
    "name": "QualityControlQuery",
    "selections": (v22/*: any*/)
  },
  "params": {
    "cacheID": "7bb2914215777e3ee9bc389e0b97c532",
    "id": null,
    "metadata": {},
    "name": "QualityControlQuery",
    "operationKind": "query",
    "text": "query QualityControlQuery(\n  $projectId: Int!\n  $domain: String\n  $limit: Int\n  $offset: Int\n  $orderBy: String\n  $orderDir: String\n  $listAllIds: Boolean\n  $basic: Boolean\n  $sampleIds: [Int!]\n  $hostIds: [Int!]\n  $location: String\n  $locationV2: [String!]\n  $taxIds: [Int!]\n  $taxLevels: [String!]\n  $thresholdFilterInfo: String\n  $annotations: [Annotation!]\n  $time: [String!]\n  $tissue: [String!]\n  $visibility: [String!]\n  $searchString: String\n  $requestedSampleIds: [Int!]\n  $workflow: String\n) {\n  samplesList(projectId: $projectId, domain: $domain, limit: $limit, offset: $offset, orderBy: $orderBy, orderDir: $orderDir, listAllIds: $listAllIds, basic: $basic, sampleIds: $sampleIds, hostIds: $hostIds, location: $location, locationV2: $locationV2, taxIds: $taxIds, taxLevels: $taxLevels, thresholdFilterInfo: $thresholdFilterInfo, annotations: $annotations, time: $time, tissue: $tissue, visibility: $visibility, searchString: $searchString, requestedSampleIds: $requestedSampleIds, workflow: $workflow) {\n    samples {\n      id\n      name\n      details {\n        dbSample {\n          uploadError\n        }\n        derivedSampleOutput {\n          pipelineRun {\n            totalReads\n          }\n          summaryStats {\n            compressionRatio\n            qcPercent\n            insertSizeMean\n          }\n        }\n        mngsRunInfo {\n          resultStatusDescription\n          reportReady\n          createdAt\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f8b5713bac78f5c3e19f7e3a4042fdf6";

export default node;
