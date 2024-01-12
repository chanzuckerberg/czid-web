/**
 * @generated SignedSource<<8ad8703bac64c522497123856dd2d74d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type queryInput_MetadataFields_input_Input = {
  authenticityToken: string;
  sampleIds: ReadonlyArray<string | null | undefined>;
};
export type SampleDetailsModeSampleMetadataFieldsQuery$variables = {
  input: queryInput_MetadataFields_input_Input;
  snapshotLinkId?: string | null | undefined;
};
export type SampleDetailsModeSampleMetadataFieldsQuery$data = {
  readonly MetadataFields: ReadonlyArray<{
    readonly dataType: string | null | undefined;
    readonly description: string | null | undefined;
    readonly group: string | null | undefined;
    readonly host_genome_ids: ReadonlyArray<number | null | undefined> | null | undefined;
    readonly isBoolean: boolean | null | undefined;
    readonly is_required: number | null | undefined;
    readonly key: string | null | undefined;
    readonly name: string | null | undefined;
    readonly options: any | null | undefined;
  } | null | undefined> | null | undefined;
};
export type SampleDetailsModeSampleMetadataFieldsQuery = {
  response: SampleDetailsModeSampleMetadataFieldsQuery$data;
  variables: SampleDetailsModeSampleMetadataFieldsQuery$variables;
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
  "name": "snapshotLinkId"
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
        "name": "snapshotLinkId",
        "variableName": "snapshotLinkId"
      }
    ],
    "concreteType": "query_MetadataFields_items",
    "kind": "LinkedField",
    "name": "MetadataFields",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "key",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "dataType",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "name",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "options",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "host_genome_ids",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "description",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "is_required",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "isBoolean",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "group",
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
    "name": "SampleDetailsModeSampleMetadataFieldsQuery",
    "selections": (v2/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "SampleDetailsModeSampleMetadataFieldsQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "f174e9e0fda6c823c5736180efe2073d",
    "id": null,
    "metadata": {},
    "name": "SampleDetailsModeSampleMetadataFieldsQuery",
    "operationKind": "query",
    "text": "query SampleDetailsModeSampleMetadataFieldsQuery(\n  $snapshotLinkId: String\n  $input: queryInput_MetadataFields_input_Input!\n) {\n  MetadataFields(snapshotLinkId: $snapshotLinkId, input: $input) {\n    key\n    dataType\n    name\n    options\n    host_genome_ids\n    description\n    is_required\n    isBoolean\n    group\n  }\n}\n"
  }
};
})();

(node as any).hash = "ce074b6ba509a8f02a4602d082a6c749";

export default node;
