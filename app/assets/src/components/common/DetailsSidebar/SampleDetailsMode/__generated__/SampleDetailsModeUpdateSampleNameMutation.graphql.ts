/**
 * @generated SignedSource<<39c0c11c56ebd6460e81790fb461651f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationInput_UpdateSampleNotes_input_Input = {
  authenticityToken: string;
  value: string;
};
export type SampleDetailsModeUpdateSampleNameMutation$variables = {
  input: mutationInput_UpdateSampleNotes_input_Input;
  sampleId: string;
};
export type SampleDetailsModeUpdateSampleNameMutation$data = {
  readonly UpdateSampleName: {
    readonly message: string | null | undefined;
    readonly status: string | null | undefined;
  } | null | undefined;
};
export type SampleDetailsModeUpdateSampleNameMutation = {
  response: SampleDetailsModeUpdateSampleNameMutation$data;
  variables: SampleDetailsModeUpdateSampleNameMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sampleId"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      },
      {
        "kind": "Variable",
        "name": "sampleId",
        "variableName": "sampleId"
      }
    ],
    "concreteType": "UpdateSampleName",
    "kind": "LinkedField",
    "name": "UpdateSampleName",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "message",
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
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "SampleDetailsModeUpdateSampleNameMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "SampleDetailsModeUpdateSampleNameMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "e42ea571146f9e58be09ec79c021c89f",
    "id": null,
    "metadata": {},
    "name": "SampleDetailsModeUpdateSampleNameMutation",
    "operationKind": "mutation",
    "text": "mutation SampleDetailsModeUpdateSampleNameMutation(\n  $sampleId: String!\n  $input: mutationInput_UpdateSampleNotes_input_Input!\n) {\n  UpdateSampleName(sampleId: $sampleId, input: $input) {\n    status\n    message\n  }\n}\n"
  }
};
})();

(node as any).hash = "6e01be1c0c294d74a9d1974bfd9352c3";

export default node;
