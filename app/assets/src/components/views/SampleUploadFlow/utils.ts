import { groupBy, maxBy, sortBy, sum } from "lodash/fp";
import { openUrlInPopupWindow } from "~/components/utils/links";
import { WORKFLOWS } from "~/components/utils/workflows";
import { getURLParamString } from "~/helpers/url";
import {
  ProjectPipelineVersions,
  SampleFromApi,
  SampleUploadType,
} from "~/interface/shared";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "./constants";

const BASESPACE_OAUTH_URL = "https://basespace.illumina.com/oauth/authorize";
const BASESPACE_OAUTH_WINDOW_NAME = "BASESPACE_OAUTH_WINDOW";
const BASESPACE_OAUTH_WINDOW_WIDTH = 1000;
const BASESPACE_OAUTH_WINDOW_HEIGHT = 600;

export const openBasespaceOAuthPopup = (params: $TSFixMe) => {
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
export const doesResultMatch = (result: $TSFixMe, query: $TSFixMe) => {
  // If no query, return all possible
  if (query === "" || query == null) return true;

  // Match chars in any position. Good for acronyms. Ignore spaces.
  const noSpaces = query.replace(/\s*/gi, "");
  const regex = new RegExp(noSpaces.split("").join(".*"), "gi");
  if (regex.test(result.name)) {
    return true;
  }
  return false;
};

// Sort matches by position of match. If no position, by func.
export const sortResults = (
  matchedResults: $TSFixMe,
  query: $TSFixMe,
  func: $TSFixMe,
) => {
  let sortedResults = sortBy(func, matchedResults);
  if (query !== "") {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'never[]' is not assignable to type 'LodashSo... Remove this comment to see the full error message
    sortedResults = sortBy(
      result => sortResultsByMatch(result, query),
      sortedResults,
    );
  }
  return sortedResults;
};

export const sortResultsByMatch = (result: { name: string }, query: string) => {
  const name = result.name.toLowerCase();
  const q = query.toLowerCase();
  return name.indexOf(q) === -1 ? Number.MAX_SAFE_INTEGER : name.indexOf(q);
};

// Remove Illumina lanes from file names (whether the name includes an extension or not)
export const removeLaneFromName = (name: string) => {
  // Illumina file name pattern: ABC_L001, ABC_L001.fastq
  return name.replace(/_L00[1-8]/, "");
};

export const groupSamplesByLane = (
  samples: SampleFromApi[],
  sampleType: SampleUploadType,
) => {
  // BaseSpace uploads can't use the same logic as local uploads because data format is different:
  // BaseSpace groups R1/R2 for us, and we need to track dataset IDs and send them to the backend,
  // where concatenation happens (with local uploads, concatenation happens in the browser).
  if (sampleType === "basespace") {
    const groups = groupBy(sample => {
      const name = removeLaneFromName(sample.name);
      const fileType = sample.file_type;
      const bsProjectId = sample.basespace_project_id;
      return `${name}:${fileType}:${bsProjectId}`;
    }, samples);

    const sampleInfo = [];
    for (const group in groups) {
      const files = groups[group];
      sampleInfo.push({
        ...files[0], // Most information is identical for all lanes
        name: removeLaneFromName(files[0].name),
        basespace_dataset_id: files
          .map(file => file.basespace_dataset_id)
          .join(","), // Track dataset IDs of each lane
        file_size: sum(files.map(file => file.file_size)),
        _selectId: files.map(file => file._selectId).join(","),
      });
    }

    return sampleInfo;
  }

  // Group samples by lanes *and* read pairs, e.g. if a user chooses the files
  // L1_R1, L1_R2, L2_R1, don't group them because we're missing L2_R2.
  const groups = groupBy(sample => {
    const sampleID = removeLaneFromName(sample.name);
    const readPairs = sample.input_files_attributes.map((f: $TSFixMe) =>
      removeLaneFromName(f.source),
    );
    readPairs.sort();
    return `${sampleID}:${readPairs.join(",")}`;
  }, samples);

  // Concatenate selected samples but don't change state
  const result = {};
  for (const group in groups) {
    const samples = groups[group];

    // For each sample, fetch R1/R2 filenames
    const readPairs: File[][] = [[], []]; // [ [list of R1 files], [list of R2 files] ]
    const readPairsConcat = {}; // { R1.fastq: concatenatedR1, R2.fastq: concatenatedR2 ]
    samples.forEach(sample => {
      const files = sortBy(file => file.name, Object.values(sample.files));
      if (files.length > 0) readPairs[0].push(files[0]);
      if (files.length === 2) readPairs[1].push(files[1]);
    });
    // Sort file names by lane
    for (const pairNb in readPairs)
      readPairs[pairNb] = sortBy(file => file.name, readPairs[pairNb]);

    // Concatenate each read pair separately to end up with 2 files: L00*_R1 and L00*_R2
    for (const pairNb in readPairs) {
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

export const getPipelineVersionString = (
  projectPipelineVersions: ProjectPipelineVersions,
  workflow: "amr" | "consensus-genome" | "mngs",
  technology: SEQUENCING_TECHNOLOGY_OPTIONS,
): string => {
  if (workflow === "amr") {
    return projectPipelineVersions[WORKFLOWS.AMR.value];
  } else if (workflow === "consensus-genome") {
    return projectPipelineVersions[WORKFLOWS.CONSENSUS_GENOME.value];
  } else {
    // workflow is "mngs"
    if (technology === SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA) {
      return projectPipelineVersions[WORKFLOWS.SHORT_READ_MNGS.value];
    } else {
      // technology is NANOPORE
      return projectPipelineVersions[WORKFLOWS.LONG_READ_MNGS.value];
    }
  }
};
