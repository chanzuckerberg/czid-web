/**
 * @generated SignedSource<<03907386ad28cf1d28b2749583e26458>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MetadataSectionContentFragment$data = {
  readonly metadata: ReadonlyArray<{
    readonly base_type: string | null | undefined;
    readonly created_at: string | null | undefined;
    readonly date_validated_value: string | null | undefined;
    readonly id: string | null | undefined;
    readonly key: string | null | undefined;
    readonly location_id: number | null | undefined;
    readonly location_validated_value: {
      readonly id?: string | null | undefined;
      readonly name?: string | null | undefined;
    } | null | undefined;
    readonly metadata_field_id: number | null | undefined;
    readonly number_validated_value: string | null | undefined;
    readonly raw_value: string | null | undefined;
    readonly sample_id: number | null | undefined;
    readonly string_validated_value: string | null | undefined;
    readonly updated_at: string | null | undefined;
  } | null | undefined> | null | undefined;
  readonly " $fragmentType": "MetadataSectionContentFragment";
};
export type MetadataSectionContentFragment$key = {
  readonly " $data"?: MetadataSectionContentFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"MetadataSectionContentFragment">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MetadataSectionContentFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "query_SampleMetadata_metadata_items",
      "kind": "LinkedField",
      "name": "metadata",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "location_id",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "raw_value",
          "storageKey": null
        },
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
          "name": "number_validated_value",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "metadata_field_id",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "sample_id",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "string_validated_value",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "updated_at",
          "storageKey": null
        },
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "date_validated_value",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": null,
          "kind": "LinkedField",
          "name": "location_validated_value",
          "plural": false,
          "selections": [
            {
              "kind": "InlineFragment",
              "selections": [
                (v1/*: any*/)
              ],
              "type": "query_SampleMetadata_metadata_items_location_validated_value_oneOf_0",
              "abstractKey": null
            },
            {
              "kind": "InlineFragment",
              "selections": [
                (v1/*: any*/),
                (v0/*: any*/)
              ],
              "type": "query_SampleMetadata_metadata_items_location_validated_value_oneOf_1",
              "abstractKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "created_at",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "base_type",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "SampleMetadata",
  "abstractKey": null
};
})();

(node as any).hash = "4fb9d0df5df745e37de6a1aad4d3d758";

export default node;
