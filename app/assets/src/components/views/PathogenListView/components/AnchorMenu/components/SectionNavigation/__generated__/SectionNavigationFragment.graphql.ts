/**
 * @generated SignedSource<<e28cabceb72796740a17e53ab5d5c062>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SectionNavigationFragment$data = {
  readonly pathogens: ReadonlyArray<{
    readonly category: string | null | undefined;
    readonly name: string | null | undefined;
  }> | null | undefined;
  readonly " $fragmentType": "SectionNavigationFragment";
};
export type SectionNavigationFragment$key = {
  readonly " $data"?: SectionNavigationFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"SectionNavigationFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "SectionNavigationFragment",
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
        }
      ],
      "storageKey": null
    }
  ],
  "type": "PathogenList",
  "abstractKey": null
};

(node as any).hash = "47b49e2df54c147fdb127d4b0a3417ba";

export default node;
