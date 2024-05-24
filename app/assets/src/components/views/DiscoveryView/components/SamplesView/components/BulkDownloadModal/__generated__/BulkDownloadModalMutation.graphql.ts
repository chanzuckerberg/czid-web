/**
 * @generated SignedSource<<5c860682e4c3790e7aa5b648f692a1d1>>
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
  readonly createAsyncBulkDownload: {
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
    "name": "createAsyncBulkDownload",
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
    "cacheID": "8ee2078b01a481a4136367aa368bbeb0",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalMutation",
    "operationKind": "mutation",
    "text": "mutation BulkDownloadModalMutation(\n  $workflowRunIdsStrings: [String]\n  $downloadFormat: String\n  $downloadType: String!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  createAsyncBulkDownload(input: {workflowRunIdsStrings: $workflowRunIdsStrings, downloadFormat: $downloadFormat, downloadType: $downloadType, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "b68bb7d4cf8c27326e2c1e34e91fde15";

export default node;
