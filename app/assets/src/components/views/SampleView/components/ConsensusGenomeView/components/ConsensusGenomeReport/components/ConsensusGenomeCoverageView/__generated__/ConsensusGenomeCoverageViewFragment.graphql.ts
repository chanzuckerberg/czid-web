/**
 * @generated SignedSource<<532187534e8dcdd4dec4dfb9087af18c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeCoverageViewFragment$data = ReadonlyArray<{
  readonly accession: {
    readonly accessionId: string | null | undefined;
  } | null | undefined;
  readonly metrics: {
    readonly coverageBreadth: number | null | undefined;
    readonly coverageDepth: number | null | undefined;
    readonly coverageTotalLength: number | null | undefined;
  } | null | undefined;
  readonly taxon: {
    readonly commonName: string | null | undefined;
    readonly id: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "ConsensusGenomeCoverageViewFragment";
}>;
export type ConsensusGenomeCoverageViewFragment$key = ReadonlyArray<{
  readonly " $data"?: ConsensusGenomeCoverageViewFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeCoverageViewFragment">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "ConsensusGenomeCoverageViewFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "query_fedConsensusGenomes_items_accession",
      "kind": "LinkedField",
      "name": "accession",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "accessionId",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_fedConsensusGenomes_items_taxon",
      "kind": "LinkedField",
      "name": "taxon",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "commonName",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_fedConsensusGenomes_items_metrics",
      "kind": "LinkedField",
      "name": "metrics",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "coverageBreadth",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "coverageDepth",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "coverageTotalLength",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_fedConsensusGenomes_items",
  "abstractKey": null
};

(node as any).hash = "a14047e07be18ea7737e4983552a30c9";

export default node;
