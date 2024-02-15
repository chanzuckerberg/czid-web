import React, { useContext, useState } from "react";
import { useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";
import RelayModernEnvironment from "relay-runtime/lib/store/RelayModernEnvironment";
import { UserContext } from "~/components/common/UserContext";
import { logError } from "~/components/utils/logUtil";
import { WorkflowType } from "~/components/utils/workflows";
import {
  ActionType,
  createAction,
  GlobalContext,
} from "~/globalContext/reducer";
import { Conditions, DiscoveryViewProps } from "~/interface/discoveryView";
import {
  DiscoveryViewFCWorkflowsQuery as DiscoveryViewFCWorkflowsQueryType,
  DiscoveryViewFCWorkflowsQuery$data,
} from "./__generated__/DiscoveryViewFCWorkflowsQuery.graphql";
import { DiscoveryView, WorkflowRunRow } from "./DiscoveryView";

async function queryWorkflowRuns(
  workflow: WorkflowType,
  { projectId, search, orderBy, orderDir, filters }: Conditions,
  props: DiscoveryViewProps,
  environment: RelayModernEnvironment,
): Promise<DiscoveryViewFCWorkflowsQuery$data> {
  // TODO: Filter out deprecateds.
  // TODO: Do not include argument fields that are null/empty arrays. NextGen will interpret them
  // as return nothing.
  const data = await fetchQuery<DiscoveryViewFCWorkflowsQueryType>(
    environment,
    DiscoveryViewFCWorkflowsQuery,
    {
      input: {
        todoRemove: {
          domain: props.domain,
          projectId: projectId?.toString(),
          search: search,
          host: filters.host,
          locationV2: filters.locationV2,
          taxon: filters.taxon,
          taxonLevels: filters.taxaLevels,
          time: filters.time,
          tissue: filters.tissue,
          visibility: filters.visibility,
          workflow,
        },
        orderBy: { startedAt: orderBy === "createdAt" ? orderDir : null },
      },
    },
  ).toPromise();
  if (data == null) {
    throw new Error(
      `Missing data: ${JSON.stringify(
        workflow,
      )} ${search} ${orderBy} ${orderDir} ${JSON.stringify(
        filters,
      )} ${JSON.stringify(props)}}`,
    );
  }

  return data;
}

// TODO(bchu): Add entityInputsInput.
const DiscoveryViewFCWorkflowsQuery = graphql`
  query DiscoveryViewFCWorkflowsQuery(
    $input: queryInput_workflowRuns_input_Input
  ) {
    workflowRuns(input: $input) {
      id
      startedAt
      status
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

export const DiscoveryViewFC = (props: DiscoveryViewProps) => {
  const { admin, allowedFeatures } = useContext(UserContext);
  const globalContext = useContext(GlobalContext);
  const environment = useRelayEnvironment();

  const [cgWorkflowRuns, setCgWorkflowRuns] = useState<
    WorkflowRunRow[] | undefined
  >();
  // TODO(bchu): Use useQueryLoader() here for parallel queries like aggregation, stats, etc. that
  // shouldn't block the entire page:

  const updateDiscoveryProjectId = (projectId: number | null) => {
    globalContext?.globalContextDispatch(
      createAction(ActionType.UPDATE_DISCOVERY_PROJECT_IDS, projectId),
    );
  };

  const fetchCgFilteredWorkflowRuns = async (
    conditions: Conditions,
  ): Promise<void> => {
    // TODO: dispose() stale queryReferences.
    // TODO: Conditionally query project IDs.
    // TODO: Add the rest of the workflows.
    setCgWorkflowRuns(undefined);
    try {
      const data = await queryWorkflowRuns(
        WorkflowType.CONSENSUS_GENOME,
        conditions,
        props,
        environment,
      );
      if (data.workflowRuns == null) {
        throw new Error(
          `Missing CG workflowRuns: ${JSON.stringify(conditions)}`,
        );
      }
      const rows = data.workflowRuns
        .filter((run): run is NonNullable<typeof run> => run != null)
        .map(
          (run): WorkflowRunRow => ({
            id: run.id,
            startedAt: run.startedAt ?? undefined,
            status: run.status ?? undefined,
            version: run.workflowVersion?.version ?? undefined,
            workflowName: run.workflowVersion?.workflow?.name ?? undefined,
            sampleId:
              run.entityInputs.edges[0]?.node.inputEntityId ?? undefined,
          }),
        );
      // TODO: Query sequencingReads in parallel for the sample IDs.
      // TODO: Make temporary Map of sample IDs to sequencingReads.
      // TODO: Filter workflowRuns by Map.
      // TODO: Make additional Map of sample IDs to arrays of workflowRuns, pass to child.
      setCgWorkflowRuns(rows);
      // TODO: Make paginated Entities query using cgRunRows.
      // TODO: Query aggregates, stats, etc.
    } catch (error) {
      logError({
        message: "[DiscoveryViewError] fetchCgFilteredWorkflowRuns() failed",
        details: { error },
      });
    }
  };

  return (
    <DiscoveryView
      {...props}
      allowedFeatures={allowedFeatures}
      isAdmin={admin}
      updateDiscoveryProjectId={updateDiscoveryProjectId}
      cgWorkflowRuns={cgWorkflowRuns}
      fetchCgWorkflowRuns={fetchCgFilteredWorkflowRuns}
    />
  );
};
