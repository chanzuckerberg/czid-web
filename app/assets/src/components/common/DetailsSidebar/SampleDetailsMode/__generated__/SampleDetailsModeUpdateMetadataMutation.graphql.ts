/**
 * @generated SignedSource<<a8ebd2d765ff4ca5a35d9ffe69db5a9b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationInput_UpdateMetadata_input_Input = {
  authenticityToken: string;
  field: string;
  value: mutationInput_UpdateMetadata_input_value_Input;
};
export type mutationInput_UpdateMetadata_input_value_Input = {
  String?: string | null | undefined;
  query_SampleMetadata_metadata_items_location_validated_value_oneOf_1_Input?: query_SampleMetadata_metadata_items_location_validated_value_oneOf_1_Input | null | undefined;
};
export type query_SampleMetadata_metadata_items_location_validated_value_oneOf_1_Input = {
  city_id?: string | null | undefined;
  city_name?: string | null | undefined;
  country_code?: string | null | undefined;
  country_id?: number | null | undefined;
  country_name?: string | null | undefined;
  created_at?: string | null | undefined;
  description?: string | null | undefined;
  geo_level?: string | null | undefined;
  id?: string | null | undefined;
  key?: string | null | undefined;
  lat?: any | null | undefined;
  lng?: any | null | undefined;
  locationiq_id?: any | null | undefined;
  name?: string | null | undefined;
  osm_id?: number | null | undefined;
  osm_type?: string | null | undefined;
  raw_value?: string | null | undefined;
  refetch_adjusted_location?: boolean | null | undefined;
  state_id?: number | null | undefined;
  state_name?: string | null | undefined;
  subdivision_id?: number | null | undefined;
  subdivision_name?: string | null | undefined;
  title?: string | null | undefined;
  updated_at?: string | null | undefined;
};
export type SampleDetailsModeUpdateMetadataMutation$variables = {
  input: mutationInput_UpdateMetadata_input_Input;
  sampleId: string;
};
export type SampleDetailsModeUpdateMetadataMutation$data = {
  readonly UpdateMetadata: {
    readonly message: string | null | undefined;
    readonly status: string | null | undefined;
  } | null | undefined;
};
export type SampleDetailsModeUpdateMetadataMutation = {
  response: SampleDetailsModeUpdateMetadataMutation$data;
  variables: SampleDetailsModeUpdateMetadataMutation$variables;
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
    "concreteType": "UpdateMetadataReponse",
    "kind": "LinkedField",
    "name": "UpdateMetadata",
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
    "name": "SampleDetailsModeUpdateMetadataMutation",
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
    "name": "SampleDetailsModeUpdateMetadataMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "0e699131abf858c5081a1d0ef61f81bc",
    "id": null,
    "metadata": {},
    "name": "SampleDetailsModeUpdateMetadataMutation",
    "operationKind": "mutation",
    "text": "mutation SampleDetailsModeUpdateMetadataMutation(\n  $sampleId: String!\n  $input: mutationInput_UpdateMetadata_input_Input!\n) {\n  UpdateMetadata(sampleId: $sampleId, input: $input) {\n    status\n    message\n  }\n}\n"
  }
};
})();

(node as any).hash = "25505e413ebdee80b39de299ac1d22df";

export default node;
