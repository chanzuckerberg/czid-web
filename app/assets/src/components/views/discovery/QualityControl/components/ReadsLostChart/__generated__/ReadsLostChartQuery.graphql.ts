/**
 * @generated SignedSource<<e23e0dac46bd9b70c03c6e9e8db0ea65>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type ReadsLostChartQuery$variables = {
  sampleIds: ReadonlyArray<string>;
};
export type ReadsLostChartQuery$data = {
  readonly sampleReadsStats: {
    readonly sampleReadsStats: ReadonlyArray<{
      readonly initialReads: number | null;
      readonly name: string | null;
      readonly pipelineVersion: string | null;
      readonly sampleId: string;
      readonly steps: ReadonlyArray<{
        readonly name: string | null;
        readonly readsAfter: number | null;
      }> | null;
      readonly wdlVersion: string | null;
    }>;
  };
};
export type ReadsLostChartQuery = {
  response: ReadsLostChartQuery$data;
  variables: ReadsLostChartQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "sampleIds"
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
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "sampleIds",
        "variableName": "sampleIds"
      }
    ],
    "concreteType": "SampleReadsStatsList",
    "kind": "LinkedField",
    "name": "sampleReadsStats",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "SampleReadsStats",
        "kind": "LinkedField",
        "name": "sampleReadsStats",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "sampleId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "initialReads",
            "storageKey": null
          },
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "pipelineVersion",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "wdlVersion",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "SampleSteps",
            "kind": "LinkedField",
            "name": "steps",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "readsAfter",
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
    "name": "ReadsLostChartQuery",
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ReadsLostChartQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "c132fe611e3b31d9e247731693a6b160",
    "id": null,
    "metadata": {},
    "name": "ReadsLostChartQuery",
    "operationKind": "query",
    "text": "query ReadsLostChartQuery(\n  $sampleIds: [String!]!\n) {\n  sampleReadsStats(sampleIds: $sampleIds) {\n    sampleReadsStats {\n      sampleId\n      initialReads\n      name\n      pipelineVersion\n      wdlVersion\n      steps {\n        name\n        readsAfter\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "d18db6897a4f5fc92cc03d8231c3bf5e";

export default node;
