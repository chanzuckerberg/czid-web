/**
 * @generated SignedSource<<50a506665e0438658dec6453647980c4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type BulkDeleteModalMutation$variables = {
  authenticityToken: string;
  ids: ReadonlyArray<number>;
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
            "name": "ids",
            "variableName": "ids"
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
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "BulkDeleteModalMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
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
    "name": "BulkDeleteModalMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "bac50d82e55cb2e3c488e75a80706061",
    "id": null,
    "metadata": {},
    "name": "BulkDeleteModalMutation",
    "operationKind": "mutation",
    "text": "mutation BulkDeleteModalMutation(\n  $ids: [Int!]!\n  $workflow: String!\n  $authenticityToken: String!\n) {\n  DeleteSamples(input: {ids: $ids, workflow: $workflow, authenticityToken: $authenticityToken}) {\n    error\n  }\n}\n"
  }
};
})();

(node as any).hash = "c73c8dbe074bd136277512b9f6b7c56e";

export default node;
