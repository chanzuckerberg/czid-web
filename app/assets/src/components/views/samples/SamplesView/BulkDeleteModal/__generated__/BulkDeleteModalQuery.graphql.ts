/**
 * @generated SignedSource<<a61882d1a4404d55b53e2c9acbbbb6ad>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type BulkDeleteModalQuery$variables = {
  authenticityToken: string;
  selectedIds?: ReadonlyArray<number | null | undefined> | null | undefined;
  selectedIdsStrings?: ReadonlyArray<string | null | undefined> | null | undefined;
  workflow: string;
};
export type BulkDeleteModalQuery$data = {
  readonly ValidateUserCanDeleteObjects: {
    readonly error: string | null | undefined;
    readonly invalidSampleNames: ReadonlyArray<string | null | undefined>;
    readonly validIds: ReadonlyArray<string | null | undefined>;
  } | null | undefined;
};
export type BulkDeleteModalQuery = {
  response: BulkDeleteModalQuery$data;
  variables: BulkDeleteModalQuery$variables;
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
  "name": "selectedIds"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "selectedIdsStrings"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "workflow"
},
v4 = [
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
            "name": "selectedIds",
            "variableName": "selectedIds"
          },
          {
            "kind": "Variable",
            "name": "selectedIdsStrings",
            "variableName": "selectedIdsStrings"
          },
          {
            "kind": "Variable",
            "name": "workflow",
            "variableName": "workflow"
          }
        ],
        "kind": "ObjectValue",
        "name": "input"
      }
    ],
    "concreteType": "ValidateUserCanDeleteObjects",
    "kind": "LinkedField",
    "name": "ValidateUserCanDeleteObjects",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "validIds",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "invalidSampleNames",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "error",
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
      (v3/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "BulkDeleteModalQuery",
    "selections": (v4/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "BulkDeleteModalQuery",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "e3c8ec553c732b52705f6de6f9cc60d8",
    "id": null,
    "metadata": {},
    "name": "BulkDeleteModalQuery",
    "operationKind": "query",
    "text": "query BulkDeleteModalQuery(\n  $selectedIds: [Int]\n  $selectedIdsStrings: [String]\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  ValidateUserCanDeleteObjects(input: {selectedIds: $selectedIds, selectedIdsStrings: $selectedIdsStrings, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    validIds\n    invalidSampleNames\n    error\n  }\n}\n"
  }
};
})();

(node as any).hash = "0e1f86a1e727d9cef4a2e5850c5f7e42";

export default node;
