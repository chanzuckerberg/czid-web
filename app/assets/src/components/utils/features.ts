// (2024-05-20) AMR_DEPRECATED_FEATURE is enabled for ~500 users. The pipeline associated with this workflow
// type has been decommissioned. However, some papers were published using data from this pipeline,
// so we want the data to be accessible to users.
export const AMR_DEPRECATED_FEATURE = "AMR";

// (2024-05-20) SORTING_V0_ADMIN_FEATURE enables sorting on all domains and will be enabled for admin testing purposes only
// This has performance implications and should not be enabled for all users
export const SORTING_V0_ADMIN_FEATURE = "sorting_v0_admin";

// (2024-05-20) SAMPLES_TABLE_METADATA_COLUMNS_ADMIN_FEATURE enables metadata columns on all domains and will be enabled for admin testing purposes only
// This has performance implications and should not be enabled for all users
export const SAMPLES_TABLE_METADATA_COLUMNS_ADMIN_FEATURE =
  "samples_table_metadata_columns_admin";

// (2024-05-20) EDIT_SNAPSHOT_LINKS_FEATURE feature flag is currently only enabled for ~30 internal users. Xochitl
// is looking into why this wasn't released to all users.
export const EDIT_SNAPSHOT_LINKS_FEATURE = "edit_snapshot_links";

// (2024-05-20) BENCHMARKING_FEATURE is an internal tool
export const BENCHMARKING_FEATURE = "benchmarking";

// WGS to NextGen pipeline migration
export const CREATE_NEXT_GEN_ENTITIES = "create_next_gen_entities";
export const SHOULD_READ_FROM_NEXTGEN = "should_read_from_nextgen";
