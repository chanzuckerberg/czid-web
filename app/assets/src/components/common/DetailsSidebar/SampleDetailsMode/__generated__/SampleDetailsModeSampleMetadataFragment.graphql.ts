/**
 * @generated SignedSource<<a0d00fd1955066971f9fd6f068006458>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SampleDetailsModeSampleMetadataFragment$data = {
  readonly additional_info: {
    readonly editable: boolean | null | undefined;
    readonly ercc_comparison: ReadonlyArray<{
      readonly actual: number | null | undefined;
      readonly expected: number | null | undefined;
      readonly name: string | null | undefined;
    } | null | undefined> | null | undefined;
    readonly host_genome_name: string | null | undefined;
    readonly host_genome_taxa_category: string | null | undefined;
    readonly name: string | null | undefined;
    readonly notes: string | null | undefined;
    readonly pipeline_run: {
      readonly adjusted_remaining_reads: number | null | undefined;
      readonly alert_sent: number | null | undefined;
      readonly alignment_config_id: number | null | undefined;
      readonly assembled: number | null | undefined;
      readonly compression_ratio: number | null | undefined;
      readonly created_at: string | null | undefined;
      readonly dag_vars: any | null | undefined;
      readonly deleted_at: any | null | undefined;
      readonly deprecated: boolean | null | undefined;
      readonly error_message: any | null | undefined;
      readonly executed_at: string | null | undefined;
      readonly finalized: number | null | undefined;
      readonly fraction_subsampled: number | null | undefined;
      readonly fraction_subsampled_bases: any | null | undefined;
      readonly guppy_basecaller_setting: any | null | undefined;
      readonly host_subtracted: string | null | undefined;
      readonly id: number | null | undefined;
      readonly job_status: string | null | undefined;
      readonly known_user_error: any | null | undefined;
      readonly mapped_reads: any | null | undefined;
      readonly max_input_fragments: number | null | undefined;
      readonly pipeline_branch: string | null | undefined;
      readonly pipeline_commit: string | null | undefined;
      readonly pipeline_execution_strategy: string | null | undefined;
      readonly pipeline_version: string | null | undefined;
      readonly qc_percent: number | null | undefined;
      readonly results_finalized: number | null | undefined;
      readonly s3_output_prefix: string | null | undefined;
      readonly sample_id: number | null | undefined;
      readonly sfn_execution_arn: string | null | undefined;
      readonly subsample: number | null | undefined;
      readonly technology: string | null | undefined;
      readonly time_to_finalized: number | null | undefined;
      readonly time_to_results_finalized: number | null | undefined;
      readonly total_bases: any | null | undefined;
      readonly total_ercc_reads: number | null | undefined;
      readonly total_reads: number | null | undefined;
      readonly truncated: any | null | undefined;
      readonly truncated_bases: any | null | undefined;
      readonly unmapped_bases: any | null | undefined;
      readonly unmapped_reads: number | null | undefined;
      readonly updated_at: string | null | undefined;
      readonly use_taxon_whitelist: boolean | null | undefined;
      readonly version: {
        readonly alignment_db: string | null | undefined;
        readonly pipeline: string | null | undefined;
      } | null | undefined;
      readonly wdl_version: string | null | undefined;
    } | null | undefined;
    readonly project_id: number | null | undefined;
    readonly project_name: string | null | undefined;
    readonly summary_stats: {
      readonly adjusted_remaining_reads: number | null | undefined;
      readonly compression_ratio: number | null | undefined;
      readonly insert_size_mean: any | null | undefined;
      readonly insert_size_standard_deviation: any | null | undefined;
      readonly last_processed_at: string | null | undefined;
      readonly percent_remaining: number | null | undefined;
      readonly qc_percent: number | null | undefined;
      readonly reads_after_bowtie2_ercc_filtered: any | null | undefined;
      readonly reads_after_bowtie2_host_filtered: number | null | undefined;
      readonly reads_after_czid_dedup: number | null | undefined;
      readonly reads_after_fastp: number | null | undefined;
      readonly reads_after_hisat2_host_filtered: number | null | undefined;
      readonly unmapped_reads: number | null | undefined;
    } | null | undefined;
    readonly upload_date: string | null | undefined;
  } | null | undefined;
  readonly metadata: ReadonlyArray<{
    readonly base_type: string | null | undefined;
    readonly created_at: string | null | undefined;
    readonly date_validated_value: string | null | undefined;
    readonly id: number | null | undefined;
    readonly key: string | null | undefined;
    readonly location_id: number | null | undefined;
    readonly metadata_field_id: number | null | undefined;
    readonly number_validated_value: string | null | undefined;
    readonly raw_value: string | null | undefined;
    readonly sample_id: number | null | undefined;
    readonly string_validated_value: string | null | undefined;
    readonly updated_at: string | null | undefined;
  } | null | undefined> | null | undefined;
  readonly " $fragmentType": "SampleDetailsModeSampleMetadataFragment";
};
export type SampleDetailsModeSampleMetadataFragment$key = {
  readonly " $data"?: SampleDetailsModeSampleMetadataFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"SampleDetailsModeSampleMetadataFragment">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "adjusted_remaining_reads",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "compression_ratio",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "created_at",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "qc_percent",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sample_id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unmapped_reads",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updated_at",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "SampleDetailsModeSampleMetadataFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "query_MetadataValues_additional_info",
      "kind": "LinkedField",
      "name": "additional_info",
      "plural": false,
      "selections": [
        (v0/*: any*/),
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
          "kind": "ScalarField",
          "name": "host_genome_taxa_category",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "host_genome_name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "query_MetadataValues_additional_info_ercc_comparison_items",
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
            (v0/*: any*/)
          ],
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
          "concreteType": "query_MetadataValues_additional_info_pipeline_run",
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
            (v1/*: any*/),
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
            (v2/*: any*/),
            (v3/*: any*/),
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
            (v4/*: any*/),
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
            (v5/*: any*/),
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
            (v6/*: any*/),
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
            (v7/*: any*/),
            (v8/*: any*/),
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
              "concreteType": "query_MetadataValues_additional_info_pipeline_run_version",
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
          "kind": "ScalarField",
          "name": "project_id",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "project_name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "query_MetadataValues_additional_info_summary_stats",
          "kind": "LinkedField",
          "name": "summary_stats",
          "plural": false,
          "selections": [
            (v1/*: any*/),
            (v2/*: any*/),
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
            (v5/*: any*/),
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
            (v7/*: any*/)
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "upload_date",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "query_MetadataValues_metadata_items",
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
        (v6/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "string_validated_value",
          "storageKey": null
        },
        (v8/*: any*/),
        (v4/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "date_validated_value",
          "storageKey": null
        },
        (v3/*: any*/),
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
  "type": "MetadataValues",
  "abstractKey": null
};
})();

(node as any).hash = "04fd5365aeef0f10041dbd0d51688521";

export default node;
