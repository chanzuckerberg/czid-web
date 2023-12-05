/**
 * @generated SignedSource<<987e6d0d6c903e7ff67cc80f45e1e8b8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AnchorMenuFragment$data = {
  readonly pathogens: ReadonlyArray<{
    readonly category: string | null | undefined;
    readonly name: string | null | undefined;
    readonly taxId: number | null | undefined;
  }> | null | undefined;
  readonly " $fragmentType": "AnchorMenuFragment";
};
export type AnchorMenuFragment$key = {
  readonly " $data"?: AnchorMenuFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"AnchorMenuFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "AnchorMenuFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Pathogen",
      "kind": "LinkedField",
      "name": "pathogens",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "category",
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
          "name": "taxId",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "PathogenList",
  "abstractKey": null
};

(node as any).hash = "f0bc3416b8eba1148aa2f9119707a15a";

export default node;
