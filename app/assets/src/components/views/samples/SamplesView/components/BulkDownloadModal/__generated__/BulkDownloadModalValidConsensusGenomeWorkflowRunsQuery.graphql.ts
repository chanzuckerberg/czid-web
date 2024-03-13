/**
 * @generated SignedSource<<9b510301ef4c8fcc31caf64ab9b4982f>>
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
  readonly fedWorkflowRuns: ReadonlyArray<{
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
    "concreteType": "query_fedWorkflowRuns_items",
    "kind": "LinkedField",
    "name": "fedWorkflowRuns",
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
    "cacheID": "1f86718ef422969c2caae0fd944cfc3d",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery",
    "operationKind": "query",
    "text": "query BulkDownloadModalValidConsensusGenomeWorkflowRunsQuery(\n  $workflowRunIds: [String]\n  $authenticityToken: String\n) {\n  fedWorkflowRuns(input: {where: {id: {_in: $workflowRunIds}}, todoRemove: {authenticityToken: $authenticityToken}}) {\n    id\n    ownerUserId\n    status\n  }\n}\n"
  }
};
})();

(node as any).hash = "cb8aa2eca0c471ca429867183b18af12";

export default node;
