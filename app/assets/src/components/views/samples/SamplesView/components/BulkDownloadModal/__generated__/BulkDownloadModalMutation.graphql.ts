/**
 * @generated SignedSource<<62066c9796c36d99d061bbfc2b110929>>
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
    "cacheID": "72f8d6335a1f2ffc9e15a6a486403364",
    "id": null,
    "metadata": {},
    "name": "BulkDownloadModalMutation",
    "operationKind": "mutation",
    "text": "mutation BulkDownloadModalMutation(\n  $workflowRunIdsStrings: [String]\n  $downloadFormat: String\n  $downloadType: String!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  CreateBulkDownload(input: {workflowRunIdsStrings: $workflowRunIdsStrings, downloadFormat: $downloadFormat, downloadType: $downloadType, workflow: $workflow, authenticityToken: $authenticityToken})\n}\n"
  }
};
})();

(node as any).hash = "c2837295a1f33395edffa5f6836cc09d";

export default node;
