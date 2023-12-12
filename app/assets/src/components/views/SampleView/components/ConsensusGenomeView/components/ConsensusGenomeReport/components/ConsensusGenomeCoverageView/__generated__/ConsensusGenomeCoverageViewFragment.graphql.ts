/**
 * @generated SignedSource<<eda7b35ce2c2642b589efbe4670be6ca>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeCoverageViewFragment$data = {
  readonly metric_consensus_genome: {
    readonly coverage_viz: {
      readonly coverage_breadth: number | null | undefined;
      readonly coverage_depth: number | null | undefined;
      readonly total_length: number | null | undefined;
    } | null | undefined;
  } | null | undefined;
  readonly reference_genome: {
    readonly accession_id: string | null | undefined;
    readonly taxon: {
      readonly id: string | null | undefined;
      readonly name: string | null | undefined;
    } | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "ConsensusGenomeCoverageViewFragment";
};
export type ConsensusGenomeCoverageViewFragment$key = {
  readonly " $data"?: ConsensusGenomeCoverageViewFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeCoverageViewFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConsensusGenomeCoverageViewFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "query_ConsensusGenomeWorkflowResults_reference_genome",
      "kind": "LinkedField",
      "name": "reference_genome",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "accession_id",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "query_ConsensusGenomeWorkflowResults_reference_genome_taxon",
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
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_ConsensusGenomeWorkflowResults_metric_consensus_genome",
      "kind": "LinkedField",
      "name": "metric_consensus_genome",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "query_ConsensusGenomeWorkflowResults_metric_consensus_genome_coverage_viz",
          "kind": "LinkedField",
          "name": "coverage_viz",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "coverage_breadth",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "coverage_depth",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "total_length",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "ConsensusGenomeWorkflowResults",
  "abstractKey": null
};

(node as any).hash = "46af4ac4b8215c0eb544ed0a124a0897";

export default node;
