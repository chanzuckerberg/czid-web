/**
 * @generated SignedSource<<220b29828d04ba7d500ba1c8957f8d4c>>
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
  readonly params: {
    readonly background: string | null | undefined;
    readonly downloadFormat: string | null | undefined;
    readonly fileFormat: string | null | undefined;
    readonly filterBy: string | null | undefined;
    readonly includeMetadata: string | null | undefined;
    readonly metric: string | null | undefined;
    readonly taxaWithReads: string | null | undefined;
  } | null | undefined;
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
      "concreteType": "query_fedBulkDownloads_items_params",
      "kind": "LinkedField",
      "name": "params",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "downloadFormat",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "metric",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "background",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "filterBy",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "taxaWithReads",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "includeMetadata",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "fileFormat",
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

(node as any).hash = "ff3da33ab7e74f2fc5d28997dce8a63c";

export default node;
