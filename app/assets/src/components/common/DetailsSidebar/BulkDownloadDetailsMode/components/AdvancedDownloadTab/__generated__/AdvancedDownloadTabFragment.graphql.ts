/**
 * @generated SignedSource<<4278f3141195c4246bc2de2fa8b8635c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AdvancedDownloadTabFragment$data = ReadonlyArray<{
  readonly downloadType: string | null | undefined;
  readonly fileSize: number | null | undefined;
  readonly id: string | null | undefined;
  readonly params: ReadonlyArray<{
    readonly displayName: string | null | undefined;
    readonly paramType: string;
    readonly value: string;
  } | null | undefined> | null | undefined;
  readonly status: string | null | undefined;
  readonly url: string | null | undefined;
  readonly " $fragmentType": "AdvancedDownloadTabFragment";
}>;
export type AdvancedDownloadTabFragment$key = ReadonlyArray<{
  readonly " $data"?: AdvancedDownloadTabFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"AdvancedDownloadTabFragment">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "AdvancedDownloadTabFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "url",
      "storageKey": null
    },
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
      "name": "fileSize",
      "storageKey": null
    },
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
    }
  ],
  "type": "query_fedBulkDownloads_items",
  "abstractKey": null
};

(node as any).hash = "73321950a93853e90e15856cbf6da8fc";

export default node;
