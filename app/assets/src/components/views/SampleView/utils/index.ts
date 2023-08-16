import { filter, get, groupBy } from "lodash/fp";
import { WORKFLOWS } from "~/components/utils/workflows";
import {
  KEY_DISCOVERY_VIEW_OPTIONS,
  SAMPLE_WAS_DELETED,
} from "~/components/views/discovery/constants";
import Sample from "~/interface/sample";
export * from "./constants";
export * from "./filters";
export * from "./notifications";
export * from "./setup";

export const addSampleDeleteFlagToSessionStorage = (sampleName: string) => {
  const shortenedSampleName =
    sampleName.length > 37 ? `${sampleName.slice(0, 37)}...` : sampleName;

  const discoverySessionState = JSON.parse(
    sessionStorage.getItem(KEY_DISCOVERY_VIEW_OPTIONS),
  );
  sessionStorage.setItem(
    KEY_DISCOVERY_VIEW_OPTIONS,
    JSON.stringify({
      ...discoverySessionState,
      [SAMPLE_WAS_DELETED]: shortenedSampleName,
    }),
  );
};

export const getConsensusGenomeData = (sample: Sample) => {
  // Mapping of taxids to WorkflowRuns
  return groupBy(
    "inputs.taxon_id",
    filter(
      { workflow: WORKFLOWS.CONSENSUS_GENOME.value },
      get("workflow_runs", sample),
    ),
  );
};
