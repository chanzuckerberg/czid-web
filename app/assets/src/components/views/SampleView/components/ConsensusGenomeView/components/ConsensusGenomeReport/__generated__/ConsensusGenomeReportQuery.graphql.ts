/**
 * @generated SignedSource<<b006c41d30f47d01b93e07b52f313e65>>
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
  readonly fedConsensusGenomes: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<"ConsensusGenomeCoverageViewFragment" | "ConsensusGenomeHistogramFragment" | "ConsensusGenomeMetricsTableFragment">;
  } | null | undefined> | null | undefined;
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
    "fields": [
      {
        "fields": [
          {
            "fields": [
              {
                "kind": "Variable",
                "name": "_eq",
                "variableName": "workflowRunId"
              }
            ],
            "kind": "ObjectValue",
            "name": "producingRunId"
          }
        ],
        "kind": "ObjectValue",
        "name": "where"
      }
    ],
    "kind": "ObjectValue",
    "name": "input"
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
        "concreteType": "query_fedConsensusGenomes_items",
        "kind": "LinkedField",
        "name": "fedConsensusGenomes",
        "plural": true,
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
        "concreteType": "query_fedConsensusGenomes_items",
        "kind": "LinkedField",
        "name": "fedConsensusGenomes",
        "plural": true,
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
              },
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
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "coverageViz",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "coverageBinSize",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
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
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "61252aa1cc6300798208251d3e273ec8",
    "id": null,
    "metadata": {},
    "name": "ConsensusGenomeReportQuery",
    "operationKind": "query",
    "text": "query ConsensusGenomeReportQuery(\n  $workflowRunId: String\n) {\n  fedConsensusGenomes(input: {where: {producingRunId: {_eq: $workflowRunId}}}) {\n    ...ConsensusGenomeMetricsTableFragment\n    ...ConsensusGenomeCoverageViewFragment\n    ...ConsensusGenomeHistogramFragment\n  }\n}\n\nfragment ConsensusGenomeCoverageViewFragment on query_fedConsensusGenomes_items {\n  accession {\n    accessionId\n  }\n  taxon {\n    name\n    id\n  }\n  metrics {\n    coverageBreadth\n    coverageDepth\n    coverageTotalLength\n  }\n}\n\nfragment ConsensusGenomeHistogramFragment on query_fedConsensusGenomes_items {\n  accession {\n    accessionId\n    accessionName\n  }\n  taxon {\n    name\n  }\n  metrics {\n    coverageViz\n    coverageBinSize\n    coverageTotalLength\n  }\n}\n\nfragment ConsensusGenomeMetricsTableFragment on query_fedConsensusGenomes_items {\n  taxon {\n    name\n  }\n  metrics {\n    mappedReads\n    nActg\n    nAmbiguous\n    nMissing\n    refSnps\n    percentIdentity\n    gcPercent\n    percentGenomeCalled\n  }\n}\n"
  }
};
})();

(node as any).hash = "65f1531af9d86e07e204588ed0bb86ca";

export default node;
