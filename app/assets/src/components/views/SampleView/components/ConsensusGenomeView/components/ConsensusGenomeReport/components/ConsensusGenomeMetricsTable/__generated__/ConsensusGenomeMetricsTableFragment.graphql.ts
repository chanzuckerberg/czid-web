/**
 * @generated SignedSource<<aee13ea2427d6e42a12747419d3eba46>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeMetricsTableFragment$data = ReadonlyArray<{
  readonly metrics: {
    readonly gcPercent: number | null | undefined;
    readonly mappedReads: number | null | undefined;
    readonly nActg: number | null | undefined;
    readonly nAmbiguous: number | null | undefined;
    readonly nMissing: number | null | undefined;
    readonly percentGenomeCalled: number | null | undefined;
    readonly percentIdentity: number | null | undefined;
    readonly refSnps: number | null | undefined;
  } | null | undefined;
  readonly taxon: {
    readonly commonName: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "ConsensusGenomeMetricsTableFragment";
}>;
export type ConsensusGenomeMetricsTableFragment$key = ReadonlyArray<{
  readonly " $data"?: ConsensusGenomeMetricsTableFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeMetricsTableFragment">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "ConsensusGenomeMetricsTableFragment",
  "selections": [
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
          "name": "mappedReads",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "nActg",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "nAmbiguous",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "nMissing",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "refSnps",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "percentIdentity",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "gcPercent",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "percentGenomeCalled",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_fedConsensusGenomes_items",
  "abstractKey": null
};

(node as any).hash = "2e48ea98ae4732eab410b94dfe415d4e";

export default node;
