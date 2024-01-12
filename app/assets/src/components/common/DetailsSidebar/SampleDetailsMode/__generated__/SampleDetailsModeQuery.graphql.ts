/**
 * @generated SignedSource<<c5c0f539f98f53d3d479a01857341cd2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type SampleDetailsModeQuery$variables = {
  sampleId: number;
};
export type SampleDetailsModeQuery$data = {
  readonly sample: {
    readonly name: string;
  };
};
export type SampleDetailsModeQuery = {
  response: SampleDetailsModeQuery$data;
  variables: SampleDetailsModeQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "sampleId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "sampleId",
    "variableName": "sampleId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "SampleDetailsModeQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Sample",
        "kind": "LinkedField",
        "name": "sample",
        "plural": false,
        "selections": [
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SampleDetailsModeQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Sample",
        "kind": "LinkedField",
        "name": "sample",
        "plural": false,
        "selections": [
          (v2/*: any*/),
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
    ]
  },
  "params": {
    "cacheID": "0ad03802a8be5d20c6b6ecbad09850d1",
    "id": null,
    "metadata": {},
    "name": "SampleDetailsModeQuery",
    "operationKind": "query",
    "text": "query SampleDetailsModeQuery(\n  $sampleId: Int!\n) {\n  sample(sampleId: $sampleId) {\n    name\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "32c741b87c99789c9399296fa9388320";

export default node;
