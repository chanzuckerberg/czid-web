/**
 * @generated SignedSource<<df4c921f23177dfba244c6e3733b1d38>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SampleDetailsModeSampleMetadataQuery$variables = {
  sampleId: string;
  snapshotLinkId?: string | null | undefined;
};
export type SampleDetailsModeSampleMetadataQuery$data = {
  readonly SampleMetadata: {
    readonly additional_info: {
      readonly editable: boolean | null | undefined;
      readonly host_genome_name: string | null | undefined;
      readonly host_genome_taxa_category: string | null | undefined;
      readonly name: string | null | undefined;
      readonly project_id: number | null | undefined;
      readonly project_name: string | null | undefined;
      readonly upload_date: string | null | undefined;
      readonly " $fragmentSpreads": FragmentRefs<"PipelineTabFragment">;
    } | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"MetadataSectionContentFragment" | "MetadataTabMetadataFragment" | "NotesTabFragment">;
  } | null | undefined;
};
export type SampleDetailsModeSampleMetadataQuery = {
  response: SampleDetailsModeSampleMetadataQuery$data;
  variables: SampleDetailsModeSampleMetadataQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "sampleId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "snapshotLinkId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "sampleId",
    "variableName": "sampleId"
  },
  {
    "kind": "Variable",
    "name": "snapshotLinkId",
    "variableName": "snapshotLinkId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "editable",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "project_id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "project_name",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "host_genome_taxa_category",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "host_genome_name",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "upload_date",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "adjusted_remaining_reads",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "compression_ratio",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "created_at",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "qc_percent",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sample_id",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unmapped_reads",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updated_at",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "SampleDetailsModeSampleMetadataQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "SampleMetadata",
        "kind": "LinkedField",
        "name": "SampleMetadata",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "MetadataTabMetadataFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "NotesTabFragment"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "MetadataSectionContentFragment"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_SampleMetadata_additional_info",
            "kind": "LinkedField",
            "name": "additional_info",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "PipelineTabFragment"
              },
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/)
            ],
            "storageKey": null
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
    "name": "SampleDetailsModeSampleMetadataQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "SampleMetadata",
        "kind": "LinkedField",
        "name": "SampleMetadata",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "query_SampleMetadata_additional_info",
            "kind": "LinkedField",
            "name": "additional_info",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "notes",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "query_SampleMetadata_additional_info_ercc_comparison_items",
                "kind": "LinkedField",
                "name": "ercc_comparison",
                "plural": true,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "actual",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "expected",
                    "storageKey": null
                  },
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "query_SampleMetadata_additional_info_pipeline_run",
                "kind": "LinkedField",
                "name": "pipeline_run",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "error_message",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "guppy_basecaller_setting",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "host_subtracted",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "job_status",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "mapped_reads",
                    "storageKey": null
                  },
                  (v9/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "alert_sent",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "alignment_config_id",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "assembled",
                    "storageKey": null
                  },
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "dag_vars",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "deleted_at",
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
                    "name": "finalized",
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
                    "name": "fraction_subsampled_bases",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "known_user_error",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "max_input_fragments",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "pipeline_branch",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "pipeline_commit",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "pipeline_execution_strategy",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "pipeline_version",
                    "storageKey": null
                  },
                  (v12/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "results_finalized",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "s3_output_prefix",
                    "storageKey": null
                  },
                  (v13/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sfn_execution_arn",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "subsample",
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
                    "name": "time_to_finalized",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "time_to_results_finalized",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "total_bases",
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
                    "name": "total_reads",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "truncated",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "truncated_bases",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "unmapped_bases",
                    "storageKey": null
                  },
                  (v14/*: any*/),
                  (v15/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "use_taxon_whitelist",
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
                    "concreteType": "query_SampleMetadata_additional_info_pipeline_run_version",
                    "kind": "LinkedField",
                    "name": "version",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "alignment_db",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "pipeline",
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
                "concreteType": "query_SampleMetadata_additional_info_summary_stats",
                "kind": "LinkedField",
                "name": "summary_stats",
                "plural": false,
                "selections": [
                  (v9/*: any*/),
                  (v10/*: any*/),
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
                    "name": "last_processed_at",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "percent_remaining",
                    "storageKey": null
                  },
                  (v12/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reads_after_bowtie2_ercc_filtered",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reads_after_bowtie2_host_filtered",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reads_after_czid_dedup",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reads_after_fastp",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reads_after_hisat2_host_filtered",
                    "storageKey": null
                  },
                  (v14/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "query_SampleMetadata_metadata_items",
            "kind": "LinkedField",
            "name": "metadata",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "location_id",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "raw_value",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "key",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "number_validated_value",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "metadata_field_id",
                "storageKey": null
              },
              (v13/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "string_validated_value",
                "storageKey": null
              },
              (v15/*: any*/),
              (v16/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "date_validated_value",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": null,
                "kind": "LinkedField",
                "name": "location_validated_value",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "__typename",
                    "storageKey": null
                  },
                  {
                    "kind": "InlineFragment",
                    "selections": [
                      (v2/*: any*/)
                    ],
                    "type": "query_SampleMetadata_metadata_items_location_validated_value_oneOf_0",
                    "abstractKey": null
                  },
                  {
                    "kind": "InlineFragment",
                    "selections": [
                      (v2/*: any*/),
                      (v16/*: any*/)
                    ],
                    "type": "query_SampleMetadata_metadata_items_location_validated_value_oneOf_1",
                    "abstractKey": null
                  }
                ],
                "storageKey": null
              },
              (v11/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "base_type",
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
    "cacheID": "7df73e7dbdc425b1bc59c563d74e565b",
    "id": null,
    "metadata": {},
    "name": "SampleDetailsModeSampleMetadataQuery",
    "operationKind": "query",
    "text": "query SampleDetailsModeSampleMetadataQuery(\n  $sampleId: String!\n  $snapshotLinkId: String\n) {\n  SampleMetadata(sampleId: $sampleId, snapshotLinkId: $snapshotLinkId) {\n    ...MetadataTabMetadataFragment\n    ...NotesTabFragment\n    ...MetadataSectionContentFragment\n    additional_info {\n      name\n      ...PipelineTabFragment\n      editable\n      project_id\n      project_name\n      host_genome_taxa_category\n      host_genome_name\n      upload_date\n    }\n  }\n}\n\nfragment MetadataSectionContentFragment on SampleMetadata {\n  metadata {\n    location_id\n    raw_value\n    key\n    number_validated_value\n    metadata_field_id\n    sample_id\n    string_validated_value\n    updated_at\n    id\n    date_validated_value\n    location_validated_value {\n      __typename\n      ... on query_SampleMetadata_metadata_items_location_validated_value_oneOf_0 {\n        name\n      }\n      ... on query_SampleMetadata_metadata_items_location_validated_value_oneOf_1 {\n        name\n        id\n      }\n    }\n    created_at\n    base_type\n  }\n}\n\nfragment MetadataTabMetadataFragment on SampleMetadata {\n  additional_info {\n    name\n    editable\n    project_id\n    project_name\n    host_genome_taxa_category\n    host_genome_name\n    upload_date\n  }\n}\n\nfragment NotesTabFragment on SampleMetadata {\n  additional_info {\n    notes\n    editable\n  }\n}\n\nfragment PipelineTabFragment on query_SampleMetadata_additional_info {\n  ercc_comparison {\n    actual\n    expected\n    name\n  }\n  pipeline_run {\n    error_message\n    guppy_basecaller_setting\n    host_subtracted\n    job_status\n    mapped_reads\n    adjusted_remaining_reads\n    alert_sent\n    alignment_config_id\n    assembled\n    compression_ratio\n    created_at\n    dag_vars\n    deleted_at\n    deprecated\n    executed_at\n    finalized\n    fraction_subsampled\n    fraction_subsampled_bases\n    known_user_error\n    max_input_fragments\n    pipeline_branch\n    pipeline_commit\n    pipeline_execution_strategy\n    pipeline_version\n    qc_percent\n    results_finalized\n    s3_output_prefix\n    sample_id\n    sfn_execution_arn\n    subsample\n    technology\n    time_to_finalized\n    time_to_results_finalized\n    total_bases\n    total_ercc_reads\n    total_reads\n    truncated\n    truncated_bases\n    unmapped_bases\n    unmapped_reads\n    updated_at\n    use_taxon_whitelist\n    wdl_version\n    version {\n      alignment_db\n      pipeline\n    }\n  }\n  summary_stats {\n    adjusted_remaining_reads\n    compression_ratio\n    insert_size_mean\n    insert_size_standard_deviation\n    last_processed_at\n    percent_remaining\n    qc_percent\n    reads_after_bowtie2_ercc_filtered\n    reads_after_bowtie2_host_filtered\n    reads_after_czid_dedup\n    reads_after_fastp\n    reads_after_hisat2_host_filtered\n    unmapped_reads\n  }\n}\n"
  }
};
})();

(node as any).hash = "b525c213e7d7e6c2945b2abe0bc81527";

export default node;
