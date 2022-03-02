import { groupBy, maxBy, sortBy } from "lodash/fp";

import { openUrlInPopupWindow } from "~/components/utils/links";
import { getURLParamString } from "~/helpers/url";

const BASESPACE_OAUTH_URL = "https://basespace.illumina.com/oauth/authorize";
const BASESPACE_OAUTH_WINDOW_NAME = "BASESPACE_OAUTH_WINDOW";
const BASESPACE_OAUTH_WINDOW_WIDTH = 1000;
const BASESPACE_OAUTH_WINDOW_HEIGHT = 600;

export const openBasespaceOAuthPopup = params => {
  const urlParams = getURLParamString({
    ...params,
    response_type: "code",
  });

  return openUrlInPopupWindow(
    `${BASESPACE_OAUTH_URL}?${urlParams}`,
    BASESPACE_OAUTH_WINDOW_NAME,
    BASESPACE_OAUTH_WINDOW_WIDTH,
    BASESPACE_OAUTH_WINDOW_HEIGHT,
  );
};

// The following three functions were extracted from SampleTypeSearchBox.
// They aid client-side search of options.
export const doesResultMatch = (result, query) => {
  // If no query, return all possible
  if (query === "") return true;

  // Match chars in any position. Good for acronyms. Ignore spaces.
  const noSpaces = query.replace(/\s*/gi, "");
  const regex = new RegExp(noSpaces.split("").join(".*"), "gi");
  if (regex.test(result.name)) {
    return true;
  }
  return false;
};

// Sort matches by position of match. If no position, by func.
export const sortResults = (matchedResults, query, func) => {
  let sortedResults = sortBy(func, matchedResults);
  if (query !== "") {
    sortedResults = sortBy(
      result => sortResultsByMatch(result, query),
      sortedResults,
    );
  }
  return sortedResults;
};

export const sortResultsByMatch = (result, query) => {
  const name = result.name.toLowerCase();
  const q = query.toLowerCase();
  const res =
    name.indexOf(q) === -1 ? Number.MAX_SAFE_INTEGER : name.indexOf(q);
  return res;
};

export const removeLaneFromName = name => {
  return name.replace(/_L00[1-8]/, "");
};

export const groupSamplesByLane = samples => {
  // Group samples by lanes *and* read pairs, e.g. if a user chooses the files
  // L1_R1, L1_R2, L2_R1, don't group them because we're missing L2_R2.
  const groups = groupBy(sample => {
    const sampleID = removeLaneFromName(sample.name);
    const readPairs = sample.input_files_attributes.map(f =>
      removeLaneFromName(f.source),
    );
    readPairs.sort();
    return `${sampleID}:${readPairs.join(",")}`;
  }, samples);

  // Concatenate selected samples but don't change state
  const result = {};
  for (let group in groups) {
    const samples = groups[group];

    // For each sample, fetch R1/R2 filenames
    let readPairs = [[], []]; // [ [list of R1 files], [list of R2 files] ]
    let readPairsConcat = {}; // { R1.fastq: concatenatedR1, R2.fastq: concatenatedR2 ]
    samples.forEach(sample => {
      const files = sortBy(file => file.name, Object.values(sample.files));
      if (files.length > 0) readPairs[0].push(files[0]);
      if (files.length === 2) readPairs[1].push(files[1]);
    });
    // Sort file names by lane
    for (let pairNb in readPairs)
      readPairs[pairNb] = sortBy(file => file.name, readPairs[pairNb]);

    // Concatenate each read pair separately to end up with 2 files: L00*_R1 and L00*_R2
    for (let pairNb in readPairs) {
      const laneFiles = readPairs[pairNb];
      if (laneFiles.length > 0) {
        const fileName = removeLaneFromName(laneFiles[0].name);
        readPairsConcat[fileName] = new File(laneFiles, fileName, {
          // Make sure we can still rely on timestamps for checking if files change
          lastModified: maxBy(f => f.lastModified, laneFiles).lastModified,
        });
      }
    }

    // Combined attributes = first sample's attributes without lane numbers
    const filesAttributes = samples[0].input_files_attributes.map(
      (file, pairNb) => ({
        ...file,
        parts: removeLaneFromName(file.parts),
        source: removeLaneFromName(file.source),
        concatenated: readPairs[pairNb].map(file => file.name),
      }),
    );

    // Generate modified sample object
    const sampleConcat = {
      ...samples[0],
      name: removeLaneFromName(samples[0].name),
      files: readPairsConcat,
      input_files_attributes: filesAttributes,
    };

    // Save useful info for each group
    result[group] = {
      files: groups[group],
      concatenated: sampleConcat,
      filesR1: sortBy(file => file.name, readPairs[0]),
      filesR2: sortBy(file => file.name, readPairs[1]),
    };
  }

  return result;
};
