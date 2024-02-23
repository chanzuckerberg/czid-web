/**
 * @generated SignedSource<<c196f050fe91b6486c905fc47e80ef45>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery$variables = {
  authenticityToken?: string | null | undefined;
  workflowRunIds?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery$data = {
  readonly workflowRuns: ReadonlyArray<{
    readonly id: string;
    readonly ownerUserId: number;
    readonly status: string | null | undefined;
  } | null | undefined> | null | undefined;
};
export type BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery = {
  response: BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery$data;
  variables: BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "authenticityToken"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflowRunIds"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "fields": [
              {
                "kind": "Variable",
                "name": "authenticityToken",
                "variableName": "authenticityToken"
              }
            ],
            "kind": "ObjectValue",
            "name": "todoRemove"
          },
          {
            "fields": [
              {
                "fields": [
                  {
                    "kind": "Variable",
                    "name": "_in",
                    "variableName": "workflowRunIds"
                  }
                ],
                "kind": "ObjectValue",
                "name": "id"
              }
            ],
            "kind": "ObjectValue",
            "name": "where"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "query_workflowRuns_items",
    "kind": "LinkedField",
    "name": "workflowRuns",
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
        "name": "ownerUserId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
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
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery",
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "6ab983936f27f8eb8751818a93988fb0",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery",
    "operationKind": "query",
    "text": "query BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery(\n  $workflowRunIds: [String]\n  $authenticityToken: String\n) {\n  workflowRuns(input: {where: {id: {_in: $workflowRunIds}}, todoRemove: {authenticityToken: $authenticityToken}}) {\n    id\n    ownerUserId\n    status\n  }\n}\n"
  }
};
})();

(node as any).hash = "7c137783bf580535294f3991725a9c58";

export default node;
