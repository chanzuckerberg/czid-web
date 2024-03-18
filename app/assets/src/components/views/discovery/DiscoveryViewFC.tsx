import { toLower } from "lodash/fp";
import React, { useContext, useRef, useState } from "react";
import { useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";
import RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment";
import { getProjects } from "~/api";
import { UserContext } from "~/components/common/UserContext";
import { logError } from "~/components/utils/logUtil";
import { isNotNullish } from "~/components/utils/typeUtils";
import { WorkflowType } from "~/components/utils/workflows";
import { DEFAULT_PAGE_SIZE } from "~/components/visualizations/table/constants";
import {
  ActionType,
  createAction,
  GlobalContext,
} from "~/globalContext/reducer";
import { formatSemanticVersion } from "~/helpers/strings";
import { Conditions, DiscoveryViewProps } from "~/interface/discoveryView";
import {
  CgEntityRow,
  CgRow,
  Metadata,
  WorkflowRunRow,
} from "../samples/SamplesView/SamplesView";
import {
  DiscoveryViewFCFedWorkflowRunsAggregateQuery as DiscoveryViewFCFedWorkflowRunsAggregateQueryType,
  DiscoveryViewFCFedWorkflowRunsAggregateQuery$data,
} from "./__generated__/DiscoveryViewFCFedWorkflowRunsAggregateQuery.graphql";
import {
  DiscoveryViewFCSequencingReadIdsQuery as DiscoveryViewFCSequencingReadIdsQueryType,
  DiscoveryViewFCSequencingReadIdsQuery$data,
  queryInput_fedSequencingReads_input_Input,
} from "./__generated__/DiscoveryViewFCSequencingReadIdsQuery.graphql";
import {
  DiscoveryViewFCSequencingReadsQuery as DiscoveryViewFCSequencingReadsQueryType,
  queryInput_fedSequencingReads_input_orderBy_Input,
} from "./__generated__/DiscoveryViewFCSequencingReadsQuery.graphql";
import {
  DiscoveryViewFCWorkflowsQuery as DiscoveryViewFCWorkflowsQueryType,
  queryInput_fedWorkflowRuns_input_Input,
  queryInput_fedWorkflowRuns_input_orderByArray_items_Input,
  queryInput_fedWorkflowRuns_input_where_collectionId_Input,
} from "./__generated__/DiscoveryViewFCWorkflowsQuery.graphql";
import {
  DISCOVERY_DOMAIN_ALL_DATA,
  formatWetlabProtocol,
} from "./discovery_api";
import { DiscoveryView } from "./DiscoveryView";
import { STATUS_TYPE } from "./TableRenderers";

export type ProjectCountsType = {
  [key: number]: {
    [key: string]: number;
  };
};

const NEXT_GEN_TO_LEGACY_STATUS: Record<string, keyof typeof STATUS_TYPE> = {
  SUCCEEDED: "complete",
  SUCCEEDED_WITH_ISSUE: "complete - issue",
  TIMED_OUT: "timed out",
  ABORTED: "aborted",
  FAILED: "failed",
  CREATED: "running",
  PENDING: "waiting",
  STARTED: "running",
  RUNNING: "running",
};

// TODO(bchu): Add entityInputsInput.
const DiscoveryViewFCWorkflowsQuery = graphql`
  query DiscoveryViewFCWorkflowsQuery(
    $input: queryInput_fedWorkflowRuns_input_Input
  ) {
    fedWorkflowRuns(input: $input) {
      id
      startedAt
      status
      rawInputsJson
      workflowVersion {
        version
        workflow {
          name
        }
      }
      entityInputs {
        edges {
          node {
            inputEntityId
            entityType
          }
        }
      }
    }
  }
`;

const DiscoveryViewFCSequencingReadIdsQuery = graphql`
  query DiscoveryViewFCSequencingReadIdsQuery(
    $input: queryInput_fedSequencingReads_input_Input
  ) {
    fedSequencingReads(input: $input) {
      id
    }
  }
`;

const DiscoveryViewFCSequencingReadsQuery = graphql`
  query DiscoveryViewFCSequencingReadsQuery(
    $input: queryInput_fedSequencingReads_input_Input
  ) {
    fedSequencingReads(input: $input) {
      id
      nucleicAcid
      protocol
      medakaModel
      technology
      taxon {
        name
      }
      sample {
        railsSampleId
        name
        notes
        collectionLocation
        sampleType
        waterControl
        uploadError
        hostOrganism {
          name
        }
        collection {
          name
          public
        }
        ownerUserId
        ownerUserName
        metadatas {
          edges {
            node {
              fieldName
              value
            }
          }
        }
      }
      consensusGenomes {
        edges {
          node {
            producingRunId
            taxon {
              name
            }
            accession {
              accessionId
              accessionName
            }
            metrics {
              coverageDepth
              totalReads
              gcPercent
              refSnps
              percentIdentity
              nActg
              percentGenomeCalled
              nMissing
              nAmbiguous
              referenceGenomeLength
            }
          }
        }
      }
    }
  }
`;

export const DiscoveryViewFCFedWorkflowRunsAggregateQuery = graphql`
  query DiscoveryViewFCFedWorkflowRunsAggregateQuery(
    $input: queryInput_fedWorkflowRunsAggregate_input_Input
  ) {
    fedWorkflowRunsAggregate(input: $input) {
      aggregate {
        groupBy {
          collectionId
          workflowVersion {
            workflow {
              name
            }
          }
        }
        count
      }
    }
  }
`;

/**
 * Whether we have to first hitting Rails for the list of collection IDs to filter the workflowRuns
 * query:
 *  - Visibility always requires Rails, NextGen has no collection data.
 *  - Project ID means we're only filtering by 1 project, so don't need Rails.
 *  - All Data means everything, so no collection IDs needed.
 *  - Public is the equivalent of a visibility filter.
 *  - My Data also needs to filter by the user's collections.
 */
function mustFetchProjectIds(
  domain: string,
  conditions: Partial<Conditions>,
): boolean {
  if (conditions.filters?.visibility != null) {
    return true;
  }
  if (conditions.projectId != null) {
    return false;
  }
  if (domain === DISCOVERY_DOMAIN_ALL_DATA) {
    return false;
  }

  return true;
}

async function fetchProjectIds(
  domain: string,
  conditions: Partial<Conditions>,
): Promise<number[]> {
  return getProjects({
    domain,
    filters: {
      visibility: conditions.filters?.visibility,
    },
    limit: 0,
    offset: 0,
    listAllIds: true,
  }).then(response => response.all_projects_ids);
}

async function queryWorkflowRuns(
  workflow: WorkflowType,
  { projectId, search, orderBy, orderDir, filters }: Partial<Conditions>,
  props: DiscoveryViewProps,
  environment: RelayModernEnvironment,
  projectIds?: number[],
): Promise<WorkflowRunRow[]> {
  // INPUTS:
  let collectionIdInput: queryInput_fedWorkflowRuns_input_where_collectionId_Input | null =
    null;
  if (projectId != null) {
    collectionIdInput = { _in: [parseInt(projectId)] };
  } else if (projectIds !== undefined) {
    collectionIdInput = { _in: projectIds };
  }
  let entitiesInput: queryInput_fedSequencingReads_input_Input | undefined;
  if (
    filters?.locationV2?.length ||
    filters?.host?.length ||
    filters?.tissue?.length
  ) {
    entitiesInput = {
      where: {
        collectionId: collectionIdInput,
        sample: {
          collectionLocation: filters.locationV2?.length
            ? { _in: filters.locationV2 }
            : null,
          hostOrganism: filters.host?.length
            ? {
                name: {
                  // TODO: Send names when NextGen supports hostOrganism.
                  _in: filters.host.map(hostId => hostId.toString()),
                },
              }
            : null,
          sampleType: filters.tissue?.length ? { _in: filters.tissue } : null,
        },
      },
      todoRemove: {
        domain: props.domain,
        projectId: projectId?.toString(),
        search,
        host: filters?.host,
        locationV2: filters?.locationV2,
        taxons: filters?.taxon,
        taxaLevels: filters?.taxaLevels,
        time: filters?.time,
        tissue: filters?.tissue,
        visibility: filters?.visibility,
        workflow: WorkflowType.CONSENSUS_GENOME,
      },
    };
  }
  const workflowsInput: queryInput_fedWorkflowRuns_input_Input = {
    where: {
      workflowVersion: { workflow: { name: { _in: ["consensus-genome"] } } },
      deprecatedById: { _is_null: true },
      collectionId: collectionIdInput,
      entityInputs: {
        entityType: {
          _eq: "sequencing_read",
        },
        inputEntityId: {
          _is_null: false,
        },
      },
    },
    orderByArray: getWorkflowRunsOrderBys(orderBy, orderDir), // TODO: Delete old non-Array orderBy
    todoRemove: {
      domain: props.domain,
      projectId: projectId?.toString(),
      search,
      host: filters?.host,
      locationV2: filters?.locationV2,
      taxon: filters?.taxon,
      taxonLevels: filters?.taxaLevels,
      time: filters?.time,
      tissue: filters?.tissue,
      visibility: filters?.visibility,
      orderBy,
      orderDir,
      workflow,
    },
  };

  // QUERIES:
  let entitiesPromise:
    | Promise<DiscoveryViewFCSequencingReadIdsQuery$data | undefined>
    | undefined;
  if (entitiesInput !== undefined) {
    entitiesPromise = fetchQuery<DiscoveryViewFCSequencingReadIdsQueryType>(
      environment,
      DiscoveryViewFCSequencingReadIdsQuery,
      { input: entitiesInput },
    ).toPromise();
  }
  const workflowsPromise = fetchQuery<DiscoveryViewFCWorkflowsQueryType>(
    environment,
    DiscoveryViewFCWorkflowsQuery,
    { input: workflowsInput },
  ).toPromise();
  const entitiesData =
    entitiesPromise !== undefined ? await entitiesPromise : undefined;
  const workflowsData = await workflowsPromise;
  if (
    entitiesPromise !== undefined &&
    entitiesData?.fedSequencingReads == null
  ) {
    throw new Error(
      `Missing filtered Entities data: ${JSON.stringify(entitiesData)}`,
    );
  }
  if (workflowsData?.fedWorkflowRuns == null) {
    throw new Error(
      `Missing data: ${JSON.stringify(workflowsData)} ${JSON.stringify(
        workflow,
      )} ${search} ${orderBy} ${orderDir} ${JSON.stringify(
        filters,
      )} ${JSON.stringify(props)}}`,
    );
  }

  // RESPONSE TRANSFORM:
  const sequencingReadIds =
    entitiesData !== undefined
      ? new Set(
          entitiesData.fedSequencingReads
            ?.filter(isNotNullish)
            .map(sequencingRead => sequencingRead.id),
        )
      : undefined;
  const result = workflowsData.fedWorkflowRuns
    .filter(isNotNullish)
    .filter(run => {
      const sequencingReadId = run.entityInputs.edges[0]?.node.inputEntityId;
      if (sequencingReadId == null) {
        throw new Error(
          `Couldn't find an entity input: ${JSON.stringify(run)}`,
        );
      }
      if (sequencingReadIds === undefined) {
        return true;
      }
      return sequencingReadIds.has(sequencingReadId);
    })
    .map((run): WorkflowRunRow => {
      const sequencingReadId = run.entityInputs.edges[0]?.node.inputEntityId;
      let parsedRawInput;
      try {
        parsedRawInput = JSON.parse(run.rawInputsJson ?? "");
      } catch (e) {
        parsedRawInput = {};
      }
      return {
        id: run.id,
        createdAt: run.startedAt ?? undefined,
        status:
          run.status != null
            ? NEXT_GEN_TO_LEGACY_STATUS[run.status] ?? toLower(run.status)
            : undefined,
        workflow: "consensus-genome", // TODO: Get this from the correct field in NextGen
        wdl_version:
          run.workflowVersion?.version != null
            ? formatSemanticVersion(run.workflowVersion.version)
            : undefined,
        creation_source: parsedRawInput?.["creation_source"] ?? undefined,
        inputSequencingReadId: sequencingReadId as string,
      };
    });
  // TODO: Make BE do this.
  if (orderBy === "creation_source") {
    result.sort((run1, run2) =>
      (run1.creation_source ?? "").localeCompare(run2.creation_source ?? ""),
    );
  }

  return result;
}

function getWorkflowRunsOrderBys(
  orderBy?: string,
  orderDir?: string,
): queryInput_fedWorkflowRuns_input_orderByArray_items_Input[] {
  orderDir = orderDir?.toLowerCase() ?? "desc";
  switch (orderBy) {
    case null:
    case undefined:
    case "createdAt":
      return [
        {
          startedAt: orderDir,
        },
      ];
    case "wdl_version":
      return [
        {
          workflowVersion: {
            version: orderDir,
          },
        },
      ];
    default:
      return [];
  }
}

async function querySequencingReadObjects(
  offset: number,
  sequencingReadIds: string[],
  workflowRunIds: string[],
  { projectId, search, orderBy, orderDir, filters }: Partial<Conditions>,
  props: DiscoveryViewProps,
  environment: RelayModernEnvironment,
): Promise<Array<CgEntityRow & Metadata>> {
  const orderBys = getSequencingReadsOrderBys(orderBy, orderDir);
  const data = await fetchQuery<DiscoveryViewFCSequencingReadsQueryType>(
    environment,
    DiscoveryViewFCSequencingReadsQuery,
    {
      input: {
        // limit and offset are for Rails only (they should be in todoRemove)
        limit: DEFAULT_PAGE_SIZE,
        offset,
        limitOffset:
          orderBys.length > 0
            ? {
                limit: DEFAULT_PAGE_SIZE,
                offset,
              }
            : null,
        where: {
          id: {
            _in: sequencingReadIds,
          },
        },
        // TODO: Delete old non-Array orderBy
        orderByArray: orderBys,
        consensusGenomesInput: {
          where: {
            producingRunId: {
              _in: workflowRunIds,
            },
          },
        },
        todoRemove: {
          domain: props.domain,
          projectId: projectId?.toString(),
          search,
          host: filters?.host,
          locationV2: filters?.locationV2,
          taxons: filters?.taxon,
          taxaLevels: filters?.taxaLevels,
          time: filters?.time,
          tissue: filters?.tissue,
          visibility: filters?.visibility,
          orderBy,
          orderDir,
          workflow: WorkflowType.CONSENSUS_GENOME,
        },
      },
    },
  ).toPromise();
  if (data?.fedSequencingReads == null) {
    throw new Error(
      `Missing CG data: ${search} ${orderBy} ${orderDir} ${JSON.stringify(
        filters,
      )} ${JSON.stringify(props)}}`,
    );
  }

  return data.fedSequencingReads
    .filter(isNotNullish)
    .flatMap(sequencingRead => {
      const sample = sequencingRead.sample;
      if (sample == null) {
        throw new Error(
          `Sequencing read's sample was nullish: ${JSON.stringify(
            sequencingRead,
          )}`,
        );
      }

      const rows: Array<CgEntityRow & Metadata> = [];

      const sequencingReadAndSampleFields: CgEntityRow = {
        sequencingReadId: sequencingRead.id,
        sample: {
          // TODO: Use NextGen ID when samples are no longer dual-written.
          id: sample.railsSampleId?.toString() ?? "",
          railsSampleId: sample.railsSampleId ?? undefined,
          name: sample.name,
          project: sample.collection?.name ?? undefined,
          publicAccess: sample.collection?.public ?? undefined,
          uploadError: sample.uploadError ?? undefined,
          userId: sample.ownerUserId ?? undefined,
          // TODO: Make a separate query to Rails to get usernames from WorkflowRun ownerUserIds,
          // which are currently not being read.
          userNameWhoInitiatedWorkflowRun: sample.ownerUserName ?? undefined,
        },
        host: sample.hostOrganism?.name,
        notes: sample.notes ?? undefined,
        medakaModel: sequencingRead.medakaModel ?? undefined,
        technology: sequencingRead.technology,
        wetlabProtocol:
          sequencingRead.protocol != null
            ? formatWetlabProtocol(sequencingRead.protocol)
            : undefined,
        collection_location_v2: sample.collectionLocation ?? undefined,
        nucleotide_type: sequencingRead.nucleicAcid,
        sample_type: sample.sampleType ?? undefined,
        water_control:
          sample.waterControl != null
            ? sample.waterControl
              ? "Yes"
              : "No"
            : undefined,
      };
      const metadataFields = Object.fromEntries(
        sample.metadatas.edges
          .filter(isNotNullish)
          .map(edge => [edge.node.fieldName, edge.node.value]),
      );

      rows.push({
        ...sequencingReadAndSampleFields,
        ...metadataFields,
      });
      for (const consensusGenomeEdge of sequencingRead.consensusGenomes.edges) {
        if (consensusGenomeEdge == null) {
          continue;
        }
        const node = consensusGenomeEdge.node;
        const metrics = node.metrics;
        rows.push({
          ...sequencingReadAndSampleFields,
          ...metadataFields,
          consensusGenomeProducingRunId: node.producingRunId ?? undefined,
          referenceAccession: {
            accessionName: node.accession?.accessionName ?? undefined,
            referenceAccessionId: node.accession?.accessionId ?? undefined,
            taxonName:
              sequencingRead.taxon?.name ?? node.taxon?.name ?? undefined,
          },
          coverageDepth: metrics?.coverageDepth ?? undefined,
          totalReadsCG: metrics?.totalReads ?? undefined,
          gcPercent: metrics?.gcPercent ?? undefined,
          refSnps: metrics?.refSnps ?? undefined,
          percentIdentity: metrics?.percentIdentity ?? undefined,
          nActg: metrics?.nActg ?? undefined,
          percentGenomeCalled: metrics?.percentGenomeCalled ?? undefined,
          nMissing: metrics?.nMissing ?? undefined,
          nAmbiguous: metrics?.nAmbiguous ?? undefined,
          referenceAccessionLength: metrics?.referenceGenomeLength ?? undefined,
        });
      }

      return rows;
    });
}

function getSequencingReadsOrderBys(
  orderBy?: string,
  orderDir?: string,
): queryInput_fedSequencingReads_input_orderBy_Input[] {
  orderDir = orderDir?.toLowerCase() ?? "desc";
  switch (orderBy) {
    case "technology":
    case "medakaModel":
      return [
        {
          [orderBy]: orderDir,
        },
      ];
    case "wetlabProtocol":
      return [
        {
          protocol: orderDir,
        },
      ];
    case "nucleotide_type":
      return [
        {
          nucleicAcid: orderDir,
        },
      ];
    case "sample":
      return [
        {
          sample: {
            name: orderDir,
          },
        },
      ];
    case "host":
      return [
        {
          sample: {
            hostOrganism: {
              name: orderDir,
            },
          },
        },
      ];
    default:
      return [];
  }
}

async function queryWorkflowRunsAggregate(
  { projectId, search, filters }: Conditions,
  props: DiscoveryViewProps,
  workflowRunIds: string[],
  workflows: WorkflowType[],
  environment: RelayModernEnvironment,
): Promise<ProjectCountsType | undefined> {
  const input = {
    input: {
      where: {
        id: { _in: workflowRunIds },
        workflowVersion: { workflow: { name: { _in: workflows } } },
      },
      todoRemove: {
        domain: props.domain,
        projectId: projectId?.toString(),
        search: search,
        annotations: filters.annotations,
        host: filters.host,
        locationV2: filters.locationV2,
        taxon: filters.taxon,
        taxaLevels: filters.taxaLevels,
        taxonThresholds: filters.taxonThresholds,
        time: filters.time,
        tissue: filters.tissue,
        visibility: filters.visibility,
      },
    },
  };
  const workflowsAggregate =
    await fetchQuery<DiscoveryViewFCFedWorkflowRunsAggregateQueryType>(
      environment,
      DiscoveryViewFCFedWorkflowRunsAggregateQuery,
      input,
    ).toPromise();

  return parseAggregateCounts(workflowsAggregate);
}

const parseAggregateCounts = (
  rawWorkflowsAggregateData:
    | DiscoveryViewFCFedWorkflowRunsAggregateQuery$data
    | undefined,
): ProjectCountsType | undefined => {
  const aggregateCounts =
    rawWorkflowsAggregateData?.fedWorkflowRunsAggregate?.aggregate;

  if (!aggregateCounts) {
    throw new Error(
      `Missing project workflows aggregate data: ${JSON.stringify(
        rawWorkflowsAggregateData,
      )}`,
    );
  }

  const projectCounts = {};
  aggregateCounts.filter(isNotNullish).forEach(({ count, groupBy }) => {
    const { collectionId, workflowVersion } = groupBy;
    const { name } = workflowVersion.workflow;
    projectCounts[collectionId] = {
      ...projectCounts[collectionId],
      [name]: count,
    };
  });
  return projectCounts;
};

/**
 *  _____  _                                __      ___
 * |  __ \(_)                               \ \    / (_)
 * | |  | |_ ___  ___ _____   _____ _ __ _   \ \  / / _  _____      __
 * | |  | | / __|/ __/ _ \ \ / / _ \ '__| | | \ \/ / | |/ _ \ \ /\ / /
 * | |__| | \__ \ (_| (_) \ V /  __/ |  | |_| |\  /  | |  __/\ V  V /
 * |_____/|_|___/\___\___/ \_/ \___|_|   \__, | \/   |_|\___| \_/\_/
 *                                        __/ |
 *                                       |___/
 *
 * Functional wrapper (for Relay and other hooks) that performs all GQL fetching for
 * <DiscoveryView>, which contains most state.
 */
export const DiscoveryViewFC = (props: DiscoveryViewProps) => {
  const { admin, allowedFeatures } = useContext(UserContext);
  const globalContext = useContext(GlobalContext);
  const environment = useRelayEnvironment();

  // RELAY HOOKS:
  // TODO(bchu): Use useQueryLoader() here for parallel queries like aggregation, stats, etc. that
  // shouldn't block the entire page:

  // REFS:
  const workflowRunsPromise = useRef<Promise<WorkflowRunRow[]>>(
    Promise.resolve([]),
  );
  const cgFirstPagePromise = useRef<
    Promise<Array<CgRow | undefined>> | undefined
  >();
  const cgConditions = useRef<Partial<Conditions>>({}); // TODO: Delete when no longer using Rails

  // STATE:
  const [cgWorkflowRunIds, setCgWorkflowRunIds] = useState<
    string[] | undefined
  >();
  const [cgFullRows, setCgFullRows] = useState<Array<CgRow | undefined>>([]);
  const [workflowRunsProjectAggregates, setWorkflowRunsProjectAggregates] =
    useState<ProjectCountsType | undefined>(undefined);

  const updateDiscoveryProjectId = (projectId: string | null) => {
    globalContext?.globalContextDispatch(
      createAction(
        ActionType.UPDATE_DISCOVERY_PROJECT_IDS,
        projectId ? parseInt(projectId) : null,
      ),
    );
  };

  const reset = () => {
    // TODO: dispose() stale queryReferences.
    cgFirstPagePromise.current = undefined;
    cgConditions.current = {};
    setCgWorkflowRunIds(undefined);
    setCgFullRows([]);
    setWorkflowRunsProjectAggregates(undefined);
  };

  const fetchCgFilteredWorkflowRuns = async (
    conditions: Conditions,
  ): Promise<string[]> => {
    reset();
    cgConditions.current = conditions;
    try {
      const projectIdsPromise = mustFetchProjectIds(props.domain, conditions)
        ? fetchProjectIds(props.domain, conditions)
        : Promise.resolve();
      workflowRunsPromise.current = projectIdsPromise.then(projectIds =>
        queryWorkflowRuns(
          WorkflowType.CONSENSUS_GENOME,
          conditions,
          props,
          environment,
          projectIds,
        ),
      );
      const workflowRuns = await workflowRunsPromise.current;
      const workflowRunIds = workflowRuns.map(run => run.id);
      setCgWorkflowRunIds(workflowRunIds);
      fetchCgPage(/* offset */ 0);
      // TODO: Query stats, etc.
      return workflowRunIds;
    } catch (error) {
      logError({
        message: "[DiscoveryViewError] fetchCgFilteredWorkflowRuns() failed",
        details: { error },
      });
      return [];
    }
  };

  const fetchNextGenWorkflowRuns = async (
    conditions: Conditions,
  ): Promise<void> => {
    // TODO: fetch more workflows from NextGen
    // The conditions object contains workflow but we aren't using it
    // so we can (probably?) use the same conditions to fetch multiple workflows.
    fetchCgFilteredWorkflowRuns(conditions).then(
      async (workflowRunIds: string[]) => {
        const workflowRunsAggregate = await queryWorkflowRunsAggregate(
          conditions,
          props,
          workflowRunIds,
          [WorkflowType.CONSENSUS_GENOME], // this should be all workflows represented in NextGen
          environment,
        );
        setWorkflowRunsProjectAggregates(workflowRunsAggregate);
      },
    );
  };

  const fetchCgPage = async (
    offset: number,
  ): Promise<Array<CgRow | undefined>> => {
    if (offset === 0) {
      if (cgFirstPagePromise.current !== undefined) {
        return cgFirstPagePromise.current;
      } else {
        cgFirstPagePromise.current = doFetchCgPage(offset);
        return cgFirstPagePromise.current;
      }
    }
    return doFetchCgPage(offset);
  };

  const doFetchCgPage = async (
    offset: number,
  ): Promise<Array<CgRow | undefined>> => {
    const workflowRunsPage = (await workflowRunsPromise.current).slice(
      offset,
      offset + DEFAULT_PAGE_SIZE,
    );
    const sequencingReads = await querySequencingReadObjects(
      offset, // TODO: Remove.
      workflowRunsPage.map(run => run.inputSequencingReadId),
      workflowRunsPage.map(run => run.id),
      cgConditions.current,
      props,
      environment,
    );
    const newRows: Array<CgRow | undefined> = [];
    for (const run of workflowRunsPage) {
      const sequencingReadRows = sequencingReads.filter(
        sequencingRead =>
          sequencingRead.sequencingReadId === run.inputSequencingReadId,
      );
      const matchingSequencingRead =
        sequencingReadRows?.find(
          row => row.consensusGenomeProducingRunId === run.id,
        ) ??
        sequencingReadRows?.find(
          row => row.consensusGenomeProducingRunId === undefined,
        );
      newRows.push(
        matchingSequencingRead !== undefined
          ? {
              ...run,
              ...matchingSequencingRead,
            }
          : undefined,
      );
    }
    setCgFullRows(prevFullCgRows => prevFullCgRows.concat(newRows));
    return newRows;
  };

  return (
    <DiscoveryView
      {...props}
      allowedFeatures={allowedFeatures}
      isAdmin={admin}
      updateDiscoveryProjectId={updateDiscoveryProjectId}
      /* NextGen props: */
      cgWorkflowIds={cgWorkflowRunIds}
      cgRows={cgFullRows}
      fetchCgWorkflowRuns={fetchCgFilteredWorkflowRuns}
      fetchCgPage={fetchCgPage}
      fetchNextGenWorkflowRuns={fetchNextGenWorkflowRuns}
      workflowRunsProjectAggregates={workflowRunsProjectAggregates}
    />
  );
};
