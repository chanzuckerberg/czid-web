/**
 * @generated SignedSource<<688e5aa4f6c4e152db0aa025a256c75d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type DownloadAllButtonQuery$variables = {
  workflowRunId?: string | null | undefined;
};
export type DownloadAllButtonQuery$data = {
  readonly ZipLink: {
    readonly error: string | null | undefined;
    readonly url: string | null | undefined;
  } | null | undefined;
};
export type DownloadAllButtonQuery = {
  response: DownloadAllButtonQuery$data;
  variables: DownloadAllButtonQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "workflowRunId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "workflowRunId",
        "variableName": "workflowRunId"
      }
    ],
    "concreteType": "ZipLink",
    "kind": "LinkedField",
    "name": "ZipLink",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "error",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "url",
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
    "name": "DownloadAllButtonQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DownloadAllButtonQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "959b5e5ab9a00086bee3efd5c17f814c",
    "id": null,
    "metadata": {},
    "name": "DownloadAllButtonQuery",
    "operationKind": "query",
    "text": "query DownloadAllButtonQuery(\n  $workflowRunId: String\n) {\n  ZipLink(workflowRunId: $workflowRunId) {\n    error\n    url\n  }\n}\n"
  }
};
})();

(node as any).hash = "64dbb0ad12ff9c9a0d0363bb383250ee";

export default node;
