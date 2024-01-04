/**
 * @generated SignedSource<<f0505c0ba0798790c7e29b76a2a3f47f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type BulkDeleteModalQuery$variables = {
  authenticityToken: string;
  selectedIds: ReadonlyArray<number>;
  workflow: string;
};
export type BulkDeleteModalQuery$data = {
  readonly ValidateUserCanDeleteObjects: {
    readonly error: string | null | undefined;
    readonly invalidSampleNames: ReadonlyArray<string | null | undefined>;
    readonly validIds: ReadonlyArray<number | null | undefined>;
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
  "name": "workflow"
},
v3 = [
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
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "BulkDeleteModalQuery",
    "selections": (v3/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "BulkDeleteModalQuery",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "f88fafdceb581c118b9ccbde9f865b22",
    "id": null,
    "metadata": {},
    "name": "BulkDeleteModalQuery",
    "operationKind": "query",
    "text": "query BulkDeleteModalQuery(\n  $selectedIds: [Int!]!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  ValidateUserCanDeleteObjects(input: {selectedIds: $selectedIds, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    validIds\n    invalidSampleNames\n    error\n  }\n}\n"
  }
};
})();

(node as any).hash = "05bcbc06d3b7ac4e21cd5560b2e499f7";

export default node;
