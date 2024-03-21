/**
 * @generated SignedSource<<f65ee52d10761e2e0e03682a75528be0>>
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
  readonly params: {
    readonly downloadFormat: string | null | undefined;
  } | null | undefined;
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_fedBulkDownloads_items",
  "abstractKey": null
};

(node as any).hash = "63bdb02e721304250c773fa1f680c50f";

export default node;
