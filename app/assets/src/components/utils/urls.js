import { find, values } from "lodash/fp";

import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { WORKFLOWS } from "~/components/utils/workflows";
import { URL_FIELDS } from "~/components/views/SampleView/constants";

const urlParser = new UrlQueryParser(URL_FIELDS);

const generateUrlToSampleView = ({
  sampleId,
  snapshotShareId = null,
  tempSelectedOptions = null,
  workflow = null,
  workflowRunId = null,
} = {}) => {
  // TODO(omar): Remove temporary workflow hack when cleaning up dead CG code
  const currentWorkflow =
    workflow === WORKFLOWS.CONSENSUS_GENOME_FLAT_LIST.value
      ? WORKFLOWS.CONSENSUS_GENOME.value
      : workflow;
  const currentTab = currentWorkflow
    ? find({ value: currentWorkflow }, values(WORKFLOWS)).label
    : null;
  const snapshotSharePrefix = snapshotShareId ? `/pub/${snapshotShareId}` : "";
  const queryString = `${urlParser.stringify({
    ...(tempSelectedOptions && { tempSelectedOptions }),
    currentTab,
    workflowRunId,
  })}`;

  return `${snapshotSharePrefix}/samples/${sampleId}${
    queryString === "" ? "" : `?${queryString}`
  }`;
};

export { generateUrlToSampleView };
