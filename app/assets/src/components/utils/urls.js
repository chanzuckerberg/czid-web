import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { URL_FIELDS } from "~/components/views/SampleView/constants";

const urlParser = new UrlQueryParser(URL_FIELDS);

const generateUrlToSampleView = ({
  sampleId,
  snapshotShareId = null,
  tempSelectedOptions = null,
} = {}) => {
  const snapshotSharePrefix = snapshotShareId ? `/pub/${snapshotShareId}` : "";
  const queryString = `${urlParser.stringify({
    ...(tempSelectedOptions && { tempSelectedOptions }),
  })}`;

  return `${snapshotSharePrefix}/samples/${sampleId}${
    queryString === "" ? "" : `?${queryString}`
  }`;
};

export { generateUrlToSampleView };
