/**
 * @generated SignedSource<<46eb1245abb74e95c2d2fab89cc328a4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Mutation } from 'relay-runtime';
export type mutationInput_KickoffWGSWorkflow_input_Input = {
  authenticityToken?: string | null | undefined;
  inputs_json?: mutationInput_KickoffWGSWorkflow_input_inputs_json_Input | null | undefined;
  workflow?: string | null | undefined;
};
export type mutationInput_KickoffWGSWorkflow_input_inputs_json_Input = {
  accession_id?: string | null | undefined;
  accession_name?: string | null | undefined;
  alignment_config_name?: string | null | undefined;
  taxon_id?: string | null | undefined;
  taxon_name?: string | null | undefined;
  technology?: string | null | undefined;
};
export type ConsensusGenomeCreationModalMutation$variables = {
  input?: mutationInput_KickoffWGSWorkflow_input_Input | null | undefined;
  sampleId: string;
};
export type ConsensusGenomeCreationModalMutation$data = {
  readonly KickoffWGSWorkflow: ReadonlyArray<{
    readonly deprecated: boolean | null | undefined;
    readonly executed_at: string | null | undefined;
    readonly id: string | null | undefined;
    readonly input_error: any | null | undefined;
    readonly inputs: {
      readonly accession_id: any | null | undefined;
      readonly accession_name: any | null | undefined;
      readonly card_version: string | null | undefined;
      readonly taxon_id: any | null | undefined;
      readonly taxon_name: any | null | undefined;
      readonly technology: string | null | undefined;
      readonly wildcard_version: string | null | undefined;
    } | null | undefined;
    readonly parsed_cached_results: {
      readonly quality_metrics: {
        readonly adjusted_remaining_reads: number | null | undefined;
        readonly compression_ratio: number | null | undefined;
        readonly fraction_subsampled: number | null | undefined;
        readonly insert_size_mean: any | null | undefined;
        readonly insert_size_standard_deviation: any | null | undefined;
        readonly percent_remaining: number | null | undefined;
        readonly qc_percent: number | null | undefined;
        readonly total_ercc_reads: number | null | undefined;
        readonly total_reads: number | null | undefined;
      } | null | undefined;
    } | null | undefined;
    readonly run_finalized: boolean | null | undefined;
    readonly status: string | null | undefined;
    readonly wdl_version: string | null | undefined;
    readonly workflow: string | null | undefined;
  } | null | undefined> | null | undefined;
};
export type ConsensusGenomeCreationModalMutation = {
  response: ConsensusGenomeCreationModalMutation$data;
  variables: ConsensusGenomeCreationModalMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "input"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sampleId"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      },
      {
        "kind": "Variable",
        "name": "sampleId",
        "variableName": "sampleId"
      }
    ],
    "concreteType": "mutation_KickoffWGSWorkflow_items",
    "kind": "LinkedField",
    "name": "KickoffWGSWorkflow",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "status",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "workflow",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deprecated",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "executed_at",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "input_error",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "run_finalized",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "wdl_version",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "mutation_KickoffWGSWorkflow_items_parsed_cached_results",
        "kind": "LinkedField",
        "name": "parsed_cached_results",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "mutation_KickoffWGSWorkflow_items_parsed_cached_results_quality_metrics",
            "kind": "LinkedField",
            "name": "quality_metrics",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "total_reads",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "qc_percent",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "adjusted_remaining_reads",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "compression_ratio",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "total_ercc_reads",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "fraction_subsampled",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "insert_size_mean",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "insert_size_standard_deviation",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "percent_remaining",
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
        "concreteType": "mutation_KickoffWGSWorkflow_items_inputs",
        "kind": "LinkedField",
        "name": "inputs",
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
            "kind": "ScalarField",
            "name": "taxon_id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "taxon_name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "technology",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "card_version",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "wildcard_version",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ConsensusGenomeCreationModalMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ConsensusGenomeCreationModalMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "05e9db220429a45d8c9cea327c94fbe0",
    "id": null,
    "metadata": {},
    "name": "ConsensusGenomeCreationModalMutation",
    "operationKind": "mutation",
    "text": "mutation ConsensusGenomeCreationModalMutation(\n  $sampleId: String!\n  $input: mutationInput_KickoffWGSWorkflow_input_Input\n) {\n  KickoffWGSWorkflow(sampleId: $sampleId, input: $input) {\n    id\n    status\n    workflow\n    deprecated\n    executed_at\n    input_error\n    run_finalized\n    wdl_version\n    parsed_cached_results {\n      quality_metrics {\n        total_reads\n        qc_percent\n        adjusted_remaining_reads\n        compression_ratio\n        total_ercc_reads\n        fraction_subsampled\n        insert_size_mean\n        insert_size_standard_deviation\n        percent_remaining\n      }\n    }\n    inputs {\n      accession_id\n      accession_name\n      taxon_id\n      taxon_name\n      technology\n      card_version\n      wildcard_version\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1bb6017d8f299b6295fb5b1301e9799c";

export default node;
