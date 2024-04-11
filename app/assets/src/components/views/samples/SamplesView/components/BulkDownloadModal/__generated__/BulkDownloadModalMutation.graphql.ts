/**
 * @generated SignedSource<<4a08a308462633c4855aaabec8957063>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type BulkDownloadModalMutation$variables = {
  authenticityToken: string;
  downloadFormat?: string | null | undefined;
  downloadType: string;
  workflow: string;
  workflowRunIdsStrings?: ReadonlyArray<string | null | undefined> | null | undefined;
};
export type BulkDownloadModalMutation$data = {
  readonly CreateBulkDownload: {
    readonly id: string;
  } | null | undefined;
};
export type BulkDownloadModalMutation = {
  response: BulkDownloadModalMutation$data;
  variables: BulkDownloadModalMutation$variables;
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
  "name": "downloadFormat"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "downloadType"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflow"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflowRunIdsStrings"
},
v5 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "authenticityToken",
            "variableName": "authenticityToken"
          },
          {
            "kind": "Variable",
            "name": "downloadFormat",
            "variableName": "downloadFormat"
          },
          {
            "kind": "Variable",
            "name": "downloadType",
            "variableName": "downloadType"
          },
          {
            "kind": "Variable",
            "name": "workflow",
            "variableName": "workflow"
          },
          {
            "kind": "Variable",
            "name": "workflowRunIdsStrings",
            "variableName": "workflowRunIdsStrings"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "fedCreateBulkDownload",
    "kind": "LinkedField",
    "name": "CreateBulkDownload",
    "plural": false,
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "BulkDownloadModalMutation",
    "selections": (v5/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v4/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "BulkDownloadModalMutation",
    "selections": (v5/*: any*/)
  },
  "params": {
    "cacheID": "a16f3467f2094d7015ce5a561eb768cf",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalMutation",
    "operationKind": "mutation",
    "text": "mutation BulkDownloadModalMutation(\n  $workflowRunIdsStrings: [String]\n  $downloadFormat: String\n  $downloadType: String!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  CreateBulkDownload(input: {workflowRunIdsStrings: $workflowRunIdsStrings, downloadFormat: $downloadFormat, downloadType: $downloadType, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "0cc41c0a1a985f0a93e67b0c5148d4ce";

export default node;
