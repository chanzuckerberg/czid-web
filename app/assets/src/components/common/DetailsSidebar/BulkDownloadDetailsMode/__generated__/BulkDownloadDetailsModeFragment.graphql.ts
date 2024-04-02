/**
 * @generated SignedSource<<49eb949f7999d4efd684c0cd4169a1cf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type BulkDownloadDetailsModeFragment$data = ReadonlyArray<{
  readonly downloadType: string | null | undefined;
  readonly errorMessage: string | null | undefined;
  readonly fileSize: number | null | undefined;
  readonly id: string | null | undefined;
  readonly logUrl: string | null | undefined;
  readonly params: ReadonlyArray<{
    readonly displayName: string | null | undefined;
    readonly paramType: string;
    readonly value: string;
  } | null | undefined> | null | undefined;
  readonly status: string | null | undefined;
  readonly url: string | null | undefined;
  readonly " $fragmentType": "BulkDownloadDetailsModeFragment";
}>;
export type BulkDownloadDetailsModeFragment$key = ReadonlyArray<{
  readonly " $data"?: BulkDownloadDetailsModeFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"BulkDownloadDetailsModeFragment">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "BulkDownloadDetailsModeFragment",
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
      "name": "logUrl",
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
      "kind": "ScalarField",
      "name": "errorMessage",
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

(node as any).hash = "8a8f70ffb1eea7ee5a2a8db87e4f857e";

export default node;
