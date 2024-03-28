/**
 * @generated SignedSource<<5525794d72aa7824f83adf2174d379c8>>
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
    readonly accessionId: string;
  } | null | undefined;
  readonly metrics: {
    readonly coverageBreadth: number | null | undefined;
    readonly coverageDepth: number | null | undefined;
    readonly coverageTotalLength: number | null | undefined;
  } | null | undefined;
  readonly referenceGenome: {
    readonly file: {
      readonly downloadLink: {
        readonly url: string | null | undefined;
      } | null | undefined;
    } | null | undefined;
  } | null | undefined;
  readonly taxon: {
    readonly id: string | null | undefined;
    readonly name: string;
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
          "name": "name",
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
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_fedConsensusGenomes_items_referenceGenome",
      "kind": "LinkedField",
      "name": "referenceGenome",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "query_fedConsensusGenomes_items_referenceGenome_file",
          "kind": "LinkedField",
          "name": "file",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "query_fedConsensusGenomes_items_referenceGenome_file_downloadLink",
              "kind": "LinkedField",
              "name": "downloadLink",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "url",
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_fedConsensusGenomes_items",
  "abstractKey": null
};

(node as any).hash = "3ce28c461d4e1e036882bce1a0fe8359";

export default node;
