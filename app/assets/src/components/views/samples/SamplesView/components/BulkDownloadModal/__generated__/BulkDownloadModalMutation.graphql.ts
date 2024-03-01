/**
 * @generated SignedSource<<783490cc4a9dfd49c3c98d889dbb4b38>>
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
  workflowRunIds?: ReadonlyArray<number | null | undefined> | null | undefined;
};
export type BulkDownloadModalMutation$data = {
  readonly CreateBulkDownload: any | null | undefined;
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
  "name": "workflowRunIds"
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
            "name": "workflowRunIds",
            "variableName": "workflowRunIds"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "kind": "ScalarField",
    "name": "CreateBulkDownload",
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
    "cacheID": "be1f5e4193332c97e26635f8242acdf6",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalMutation",
    "operationKind": "mutation",
    "text": "mutation BulkDownloadModalMutation(\n  $workflowRunIds: [Int]\n  $downloadFormat: String\n  $downloadType: String!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  CreateBulkDownload(input: {workflowRunIds: $workflowRunIds, downloadFormat: $downloadFormat, downloadType: $downloadType, workflow: $workflow, authenticityToken: $authenticityToken})\n}\n"
  }
};
})();

(node as any).hash = "fe315481ce68a17b1a8bcc521fac4a85";

export default node;
