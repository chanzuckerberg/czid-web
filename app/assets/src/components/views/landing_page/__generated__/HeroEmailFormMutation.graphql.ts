/**
 * @generated SignedSource<<4447479ad93f78f33a2da79fd4bc2b10>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type HeroEmailFormMutation$variables = {
  email: string;
};
export type HeroEmailFormMutation$data = {
  readonly createUser: {
    readonly email: string | null | undefined;
  };
};
export type HeroEmailFormMutation = {
  response: HeroEmailFormMutation$data;
  variables: HeroEmailFormMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "email"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "email",
        "variableName": "email"
      }
    ],
    "concreteType": "CreateUserPayload",
    "kind": "LinkedField",
    "name": "createUser",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "email",
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
    "name": "HeroEmailFormMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "HeroEmailFormMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "a94992349c323634e89008c1e7e4fcd6",
    "id": null,
    "metadata": {},
    "name": "HeroEmailFormMutation",
    "operationKind": "mutation",
    "text": "mutation HeroEmailFormMutation(\n  $email: String!\n) {\n  createUser(email: $email) {\n    email\n  }\n}\n"
  }
};
})();

(node as any).hash = "a1feb9bdff671f2f375590048fff6923";

export default node;
