/**
 * @generated SignedSource<<da0d22a4eb515913553778bd4dc6a606>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeHistogramFragment$data = {
  readonly metric_consensus_genome: {
    readonly coverage_viz: {
      readonly coverage: ReadonlyArray<ReadonlyArray<number | null | undefined> | null | undefined>;
      readonly coverage_bin_size: number;
      readonly total_length: number;
    } | null | undefined;
  } | null | undefined;
  readonly reference_genome: {
    readonly accession_id: string | null | undefined;
    readonly accession_name: string | null | undefined;
    readonly taxon: {
      readonly name: string | null | undefined;
    } | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "ConsensusGenomeHistogramFragment";
};
export type ConsensusGenomeHistogramFragment$key = {
  readonly " $data"?: ConsensusGenomeHistogramFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeHistogramFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConsensusGenomeHistogramFragment",
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
          "kind": "ScalarField",
          "name": "accession_name",
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
              "kind": "RequiredField",
              "field": {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "coverage",
                "storageKey": null
              },
              "action": "LOG",
              "path": "metric_consensus_genome.coverage_viz.coverage"
            },
            {
              "kind": "RequiredField",
              "field": {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "coverage_bin_size",
                "storageKey": null
              },
              "action": "LOG",
              "path": "metric_consensus_genome.coverage_viz.coverage_bin_size"
            },
            {
              "kind": "RequiredField",
              "field": {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "total_length",
                "storageKey": null
              },
              "action": "LOG",
              "path": "metric_consensus_genome.coverage_viz.total_length"
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

(node as any).hash = "0f9146cb058c705389f2552aefaf4c94";

export default node;
