import { find, values } from "lodash/fp";

import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { URL_FIELDS } from "~/components/views/SampleView/constants";
import { WORKFLOWS } from "~/components/utils/workflows";

const urlParser = new UrlQueryParser(URL_FIELDS);

const generateUrlToSampleView = ({
  sampleId,
  snapshotShareId = null,
  tempSelectedOptions = null,
  workflow = null,
} = {}) => {
  const currentTab = workflow
    ? find({ value: workflow }, values(WORKFLOWS)).label
    : null;
  const snapshotSharePrefix = snapshotShareId ? `/pub/${snapshotShareId}` : "";
  const queryString = `${urlParser.stringify({
    ...(tempSelectedOptions && { tempSelectedOptions }),
    currentTab,
  })}`;

  return `${snapshotSharePrefix}/samples/${sampleId}${
    queryString === "" ? "" : `?${queryString}`
  }`;
};

export { generateUrlToSampleView };
