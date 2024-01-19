import moment from "moment";
import { AdditionalInfo } from "./types";

const YYYY_MM_DD = "YYYY-MM-DD";

// Format the upload date.
export const processAdditionalInfo = (
  additionalInfo: AdditionalInfo | null | undefined,
) => {
  if (!additionalInfo) {
    return {} as AdditionalInfo;
  }
  if (additionalInfo?.upload_date) {
    return {
      ...additionalInfo,
      upload_date: moment(additionalInfo?.upload_date).format(YYYY_MM_DD),
    };
  }
  return additionalInfo;
};
