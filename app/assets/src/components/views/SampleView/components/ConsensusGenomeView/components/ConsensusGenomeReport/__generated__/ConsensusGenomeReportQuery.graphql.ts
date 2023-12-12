/**
 * @generated SignedSource<<b025aa3f1a350afdafe4fe1fb504799f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConsensusGenomeReportQuery$variables = {
  workflowRunId?: string | null | undefined;
};
export type ConsensusGenomeReportQuery$data = {
  readonly ConsensusGenomeWorkflowResults: {
    readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeCoverageViewFragment" | "ConsensusGenomeHistogramFragment" | "ConsensusGenomeMetricsTableFragment">;
  } | null | undefined;
};
export type ConsensusGenomeReportQuery = {
  response: ConsensusGenomeReportQuery$data;
  variables: ConsensusGenomeReportQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "workflowRunId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "workflowRunId",
    "variableName": "workflowRunId"
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ConsensusGenomeReportQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "ConsensusGenomeWorkflowResults",
        "kind": "LinkedField",
        "name": "ConsensusGenomeWorkflowResults",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ConsensusGenomeMetricsTableFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ConsensusGenomeCoverageViewFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ConsensusGenomeHistogramFragment"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ConsensusGenomeReportQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "ConsensusGenomeWorkflowResults",
        "kind": "LinkedField",
        "name": "ConsensusGenomeWorkflowResults",
        "plural": false,
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
              },
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
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "coverage",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "coverage_bin_size",
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
    ]
  },
  "params": {
    "cacheID": "93024901bbd1b0281334c34bb27549f9",
    "id": null,
    "metadata": {},
    "name": "ConsensusGenomeReportQuery",
    "operationKind": "query",
    "text": "query ConsensusGenomeReportQuery(\n  $workflowRunId: String\n) {\n  ConsensusGenomeWorkflowResults(workflowRunId: $workflowRunId) {\n    ...ConsensusGenomeMetricsTableFragment\n    ...ConsensusGenomeCoverageViewFragment\n    ...ConsensusGenomeHistogramFragment\n  }\n}\n\nfragment ConsensusGenomeCoverageViewFragment on ConsensusGenomeWorkflowResults {\n  reference_genome {\n    accession_id\n    taxon {\n      name\n      id\n    }\n  }\n  metric_consensus_genome {\n    coverage_viz {\n      coverage_breadth\n      coverage_depth\n      total_length\n    }\n  }\n}\n\nfragment ConsensusGenomeHistogramFragment on ConsensusGenomeWorkflowResults {\n  reference_genome {\n    accession_id\n    accession_name\n    taxon {\n      name\n    }\n  }\n  metric_consensus_genome {\n    coverage_viz {\n      coverage\n      coverage_bin_size\n      total_length\n    }\n  }\n}\n\nfragment ConsensusGenomeMetricsTableFragment on ConsensusGenomeWorkflowResults {\n  reference_genome {\n    taxon {\n      name\n    }\n  }\n  metric_consensus_genome {\n    mapped_reads\n    n_actg\n    n_ambiguous\n    n_missing\n    ref_snps\n    percent_identity\n    gc_percent\n    percent_genome_called\n  }\n}\n"
  }
};
})();

(node as any).hash = "16337102fc8050e88f45cc70d98d2562";

export default node;
