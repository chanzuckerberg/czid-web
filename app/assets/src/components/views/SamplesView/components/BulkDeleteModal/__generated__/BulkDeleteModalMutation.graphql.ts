/**
 * @generated SignedSource<<1e6cf5a943a3f144fec147838c2ebed3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type BulkDeleteModalMutation$variables = {
  authenticityToken: string;
  ids?: ReadonlyArray<number | null | undefined> | null | undefined;
  idsStrings?: ReadonlyArray<string | null | undefined> | null | undefined;
  workflow: string;
};
export type BulkDeleteModalMutation$data = {
  readonly DeleteSamples: {
    readonly error: string | null | undefined;
  } | null | undefined;
};
export type BulkDeleteModalMutation = {
  response: BulkDeleteModalMutation$data;
  variables: BulkDeleteModalMutation$variables;
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
  "name": "ids"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "idsStrings"
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
            "name": "ids",
            "variableName": "ids"
          },
          {
            "kind": "Variable",
            "name": "idsStrings",
            "variableName": "idsStrings"
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
    "concreteType": "DeleteSamples",
    "kind": "LinkedField",
    "name": "DeleteSamples",
    "plural": false,
    "selections": [
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
    "name": "BulkDeleteModalMutation",
    "selections": (v4/*: any*/),
    "type": "Mutation",
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
    "name": "BulkDeleteModalMutation",
    "selections": (v4/*: any*/)
  },
  "params": {
    "cacheID": "8bd76398ff00911a9939c9327532e4bd",
    "id": null,
    "metadata": {},
    "name": "BulkDeleteModalMutation",
    "operationKind": "mutation",
    "text": "mutation BulkDeleteModalMutation(\n  $ids: [Int]\n  $idsStrings: [String]\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  DeleteSamples(input: {ids: $ids, idsStrings: $idsStrings, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    error\n  }\n}\n"
  }
};
})();

(node as any).hash = "8df449ef68f211a5cbead64df2e280e0";

export default node;
