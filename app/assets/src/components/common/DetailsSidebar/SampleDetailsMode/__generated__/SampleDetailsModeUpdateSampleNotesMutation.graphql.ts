/**
 * @generated SignedSource<<0db0a8b3b8d2061256b1a705ddcbaa5c>>
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
export type SampleDetailsModeUpdateSampleNotesMutation$variables = {
  input: mutationInput_UpdateSampleNotes_input_Input;
  sampleId: string;
};
export type SampleDetailsModeUpdateSampleNotesMutation$data = {
  readonly UpdateSampleNotes: {
    readonly message: string | null | undefined;
    readonly status: string | null | undefined;
  } | null | undefined;
};
export type SampleDetailsModeUpdateSampleNotesMutation = {
  response: SampleDetailsModeUpdateSampleNotesMutation$data;
  variables: SampleDetailsModeUpdateSampleNotesMutation$variables;
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
    "concreteType": "UpdateSampleNotes",
    "kind": "LinkedField",
    "name": "UpdateSampleNotes",
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
    "name": "SampleDetailsModeUpdateSampleNotesMutation",
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
    "name": "SampleDetailsModeUpdateSampleNotesMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "2800a39a0b9a2ff511ceded9d964af33",
    "id": null,
    "metadata": {},
    "name": "SampleDetailsModeUpdateSampleNotesMutation",
    "operationKind": "mutation",
    "text": "mutation SampleDetailsModeUpdateSampleNotesMutation(\n  $sampleId: String!\n  $input: mutationInput_UpdateSampleNotes_input_Input!\n) {\n  UpdateSampleNotes(sampleId: $sampleId, input: $input) {\n    status\n    message\n  }\n}\n"
  }
};
})();

(node as any).hash = "42c8a0a7a7bd63999a5335941f54e763";

export default node;
