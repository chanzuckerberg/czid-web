/**
 * @generated SignedSource<<9c958948f451c57ad978a7c8166b2a4b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeHistogramFragment$data = ReadonlyArray<{
  readonly accession: {
    readonly accessionId: string | null | undefined;
    readonly accessionName: string | null | undefined;
  } | null | undefined;
  readonly metrics: {
    readonly coverageBinSize: number;
    readonly coverageTotalLength: number;
    readonly coverageViz: ReadonlyArray<ReadonlyArray<number | null | undefined> | null | undefined>;
  } | null | undefined;
  readonly taxon: {
    readonly commonName: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "ConsensusGenomeHistogramFragment";
}>;
export type ConsensusGenomeHistogramFragment$key = ReadonlyArray<{
  readonly " $data"?: ConsensusGenomeHistogramFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeHistogramFragment">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "ConsensusGenomeHistogramFragment",
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
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "accessionName",
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
          "kind": "RequiredField",
          "field": {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "coverageViz",
            "storageKey": null
          },
          "action": "LOG",
          "path": "metrics.coverageViz"
        },
        {
          "kind": "RequiredField",
          "field": {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "coverageBinSize",
            "storageKey": null
          },
          "action": "LOG",
          "path": "metrics.coverageBinSize"
        },
        {
          "kind": "RequiredField",
          "field": {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "coverageTotalLength",
            "storageKey": null
          },
          "action": "LOG",
          "path": "metrics.coverageTotalLength"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_fedConsensusGenomes_items",
  "abstractKey": null
};

(node as any).hash = "d077513c249eebf4cc0d9a57da03cb8b";

export default node;
