import {
  KEY_DISCOVERY_VIEW_OPTIONS,
  SAMPLE_WAS_DELETED,
} from "../discovery/constants";

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
