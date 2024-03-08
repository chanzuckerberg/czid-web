/**
 * @generated SignedSource<<f6eb39288f25d6bb29df1ca642805d5f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type SampleViewSampleQuery$variables = {
  railsSampleId?: string | null | undefined;
  snapshotLinkId?: string | null | undefined;
};
export type SampleViewSampleQuery$data = {
  readonly SampleForReport: {
    readonly created_at: string | null | undefined;
    readonly default_background_id: number | null | undefined;
    readonly default_pipeline_run_id: number | null | undefined;
    readonly editable: boolean | null | undefined;
    readonly host_genome_id: number | null | undefined;
    readonly id: string | null | undefined;
    readonly initial_workflow: string | null | undefined;
    readonly name: string | null | undefined;
    readonly pipeline_runs: ReadonlyArray<{
      readonly adjusted_remaining_reads: number | null | undefined;
      readonly alignment_config_name: string | null | undefined;
      readonly assembled: number | null | undefined;
      readonly created_at: string | null | undefined;
      readonly id: string | null | undefined;
      readonly pipeline_version: string | null | undefined;
      readonly run_finalized: boolean | null | undefined;
      readonly total_ercc_reads: number | null | undefined;
      readonly wdl_version: string | null | undefined;
    } | null | undefined> | null | undefined;
    readonly project: {
      readonly id: string | null | undefined;
      readonly name: string | null | undefined;
    } | null | undefined;
    readonly project_id: number | null | undefined;
    readonly railsSampleId: string | null | undefined;
    readonly status: string | null | undefined;
    readonly updated_at: string | null | undefined;
    readonly upload_error: string | null | undefined;
    readonly user_id: number | null | undefined;
    readonly workflow_runs: ReadonlyArray<{
      readonly deprecated: boolean | null | undefined;
      readonly executed_at: string | null | undefined;
      readonly id: string | null | undefined;
      readonly input_error: string | null | undefined;
      readonly inputs: {
        readonly accession_id: string | null | undefined;
        readonly accession_name: string | null | undefined;
        readonly creation_source: string | null | undefined;
        readonly ref_fasta: string | null | undefined;
        readonly taxon_id: string | null | undefined;
        readonly taxon_name: string | null | undefined;
        readonly technology: string | null | undefined;
      } | null | undefined;
      readonly run_finalized: boolean | null | undefined;
      readonly status: string | null | undefined;
      readonly wdl_version: string | null | undefined;
      readonly workflow: string | null | undefined;
    } | null | undefined> | null | undefined;
  } | null | undefined;
};
export type SampleViewSampleQuery = {
  response: SampleViewSampleQuery$data;
  variables: SampleViewSampleQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "railsSampleId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "snapshotLinkId"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "created_at",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "run_finalized",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "wdl_version",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v7 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "railsSampleId",
        "variableName": "railsSampleId"
      },
      {
        "kind": "Variable",
        "name": "snapshotLinkId",
        "variableName": "snapshotLinkId"
      }
    ],
    "concreteType": "SampleForReport",
    "kind": "LinkedField",
    "name": "SampleForReport",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      (v2/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "default_background_id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "default_pipeline_run_id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "editable",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "host_genome_id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "initial_workflow",
        "storageKey": null
      },
      (v3/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "query_SampleForReport_pipeline_runs_items",
        "kind": "LinkedField",
        "name": "pipeline_runs",
        "plural": true,
        "selections": [
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
            "name": "alignment_config_name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "assembled",
            "storageKey": null
          },
          (v2/*: any*/),
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "pipeline_version",
            "storageKey": null
          },
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "total_ercc_reads",
            "storageKey": null
          },
          (v5/*: any*/)
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_SampleForReport_project",
        "kind": "LinkedField",
        "name": "project",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v3/*: any*/)
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "project_id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "railsSampleId",
        "storageKey": null
      },
      (v6/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "updated_at",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "upload_error",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "user_id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "query_SampleForReport_workflow_runs_items",
        "kind": "LinkedField",
        "name": "workflow_runs",
        "plural": true,
        "selections": [
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
          (v1/*: any*/),
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
            "concreteType": "query_SampleForReport_workflow_runs_items_inputs",
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
                "name": "creation_source",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "ref_fasta",
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
              }
            ],
            "storageKey": null
          },
          (v4/*: any*/),
          (v6/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "workflow",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "SampleViewSampleQuery",
    "selections": (v7/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "SampleViewSampleQuery",
    "selections": (v7/*: any*/)
  },
  "params": {
    "cacheID": "906d013ed1e41b8ba4d1b6442a242fb1",
    "id": null,
    "metadata": {},
    "name": "SampleViewSampleQuery",
    "operationKind": "query",
    "text": "query SampleViewSampleQuery(\n  $railsSampleId: String\n  $snapshotLinkId: String\n) {\n  SampleForReport(railsSampleId: $railsSampleId, snapshotLinkId: $snapshotLinkId) {\n    id\n    created_at\n    default_background_id\n    default_pipeline_run_id\n    editable\n    host_genome_id\n    initial_workflow\n    name\n    pipeline_runs {\n      adjusted_remaining_reads\n      alignment_config_name\n      assembled\n      created_at\n      id\n      pipeline_version\n      run_finalized\n      total_ercc_reads\n      wdl_version\n    }\n    project {\n      id\n      name\n    }\n    project_id\n    railsSampleId\n    status\n    updated_at\n    upload_error\n    user_id\n    workflow_runs {\n      deprecated\n      executed_at\n      id\n      input_error\n      inputs {\n        accession_id\n        accession_name\n        creation_source\n        ref_fasta\n        taxon_id\n        taxon_name\n        technology\n      }\n      run_finalized\n      status\n      wdl_version\n      workflow\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "296e5f8b2bb8b1ffebdaefb367bca0bd";

export default node;
