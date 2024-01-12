/**
 * @generated SignedSource<<0c4d60f593a0e2d388301bf77af4b772>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type NotesTabFragment$data = {
  readonly additional_info: {
    readonly editable: boolean | null | undefined;
    readonly notes: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "NotesTabFragment";
};
export type NotesTabFragment$key = {
  readonly " $data"?: NotesTabFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"NotesTabFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "NotesTabFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "query_SampleMetadata_additional_info",
      "kind": "LinkedField",
      "name": "additional_info",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "notes",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "editable",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "SampleMetadata",
  "abstractKey": null
};

(node as any).hash = "d1e2299c82bd71b58445c3aeaf718615";

export default node;
