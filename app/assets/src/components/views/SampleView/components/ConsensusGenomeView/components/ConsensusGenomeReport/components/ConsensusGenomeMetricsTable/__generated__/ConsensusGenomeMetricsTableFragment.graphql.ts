/**
 * @generated SignedSource<<9ed965951daf5094d119fb3bf0ed8dd0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeMetricsTableFragment$data = {
  readonly metric_consensus_genome: {
    readonly gc_percent: number | null | undefined;
    readonly mapped_reads: number | null | undefined;
    readonly n_actg: number | null | undefined;
    readonly n_ambiguous: number | null | undefined;
    readonly n_missing: number | null | undefined;
    readonly percent_genome_called: number | null | undefined;
    readonly percent_identity: number | null | undefined;
    readonly ref_snps: number | null | undefined;
  } | null | undefined;
  readonly reference_genome: {
    readonly taxon: {
      readonly name: string | null | undefined;
    } | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "ConsensusGenomeMetricsTableFragment";
};
export type ConsensusGenomeMetricsTableFragment$key = {
  readonly " $data"?: ConsensusGenomeMetricsTableFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeMetricsTableFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConsensusGenomeMetricsTableFragment",
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
          "kind": "ScalarField",
          "name": "mapped_reads",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "n_actg",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "n_ambiguous",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "n_missing",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "ref_snps",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "percent_identity",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "gc_percent",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "percent_genome_called",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "ConsensusGenomeWorkflowResults",
  "abstractKey": null
};

(node as any).hash = "996fc5f7f1c09b262bbebefc5bb8a853";

export default node;
