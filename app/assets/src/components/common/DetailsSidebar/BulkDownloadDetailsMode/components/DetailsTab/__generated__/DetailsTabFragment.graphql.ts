/**
 * @generated SignedSource<<d684c48d51a9cb583e4112ab8595ba68>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type DetailsTabFragment$data = ReadonlyArray<{
  readonly downloadType: string | null | undefined;
  readonly entityInputs: ReadonlyArray<{
    readonly id: string | null | undefined;
    readonly name: string | null | undefined;
  } | null | undefined> | null | undefined;
  readonly id: string | null | undefined;
  readonly params: ReadonlyArray<{
    readonly displayName: string | null | undefined;
    readonly paramType: string;
    readonly value: string;
  } | null | undefined> | null | undefined;
  readonly " $fragmentType": "DetailsTabFragment";
}>;
export type DetailsTabFragment$key = ReadonlyArray<{
  readonly " $data"?: DetailsTabFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"DetailsTabFragment">;
}>;

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "DetailsTabFragment",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "downloadType",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_fedBulkDownloads_items_params_items",
      "kind": "LinkedField",
      "name": "params",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "paramType",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "value",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "displayName",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_fedBulkDownloads_items_entityInputs_items",
      "kind": "LinkedField",
      "name": "entityInputs",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "name",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_fedBulkDownloads_items",
  "abstractKey": null
};
})();

(node as any).hash = "6e5b87759f2e78db112412b35f7647ee";

export default node;
