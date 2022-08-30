import { sortBy, filter } from "lodash/fp";
import memoize from "memoize-one";
import { formatPercent } from "~/components/utils/format";
import {
  AccessionsData,
  AccessionsSummary,
  CoverageVizBottomSidebarProps,
  HistogramTooltipData,
  Hit,
} from "./types";
// Gets called on every mouse move, so need to memoize.
export const getHistogramTooltipData = memoize(
  (
    accessionData: AccessionsData,
    coverageIndex: number,
  ): HistogramTooltipData[] => {
    // coverageObj format:
    //   [binIndex, averageCoverageDepth, coverageBreadth, numberContigs, numberReads]
    const coverageObj = accessionData.coverage[coverageIndex];
    const binSize = accessionData.coverage_bin_size;

    return [
      {
        name: "Coverage",
        data: [
          [
            "Base Pair Range",
            // \u2013 is en-dash
            `${Math.round(coverageObj[0] * binSize)}\u2013${Math.round(
              (coverageObj[0] + 1) * binSize,
            )}`,
          ],
          ["Coverage Depth", `${coverageObj[1]}x`],
          ["Coverage Breadth", formatPercent(coverageObj[2])],
          ["Overlapping Contigs", `${coverageObj[3]}`],
          ["Overlapping Loose Reads", `${coverageObj[4]}`],
        ],
      },
    ];
  },
);

// Gets called on every mouse move, so need to memoize.
export const getGenomeVizTooltipData = memoize(
  (
    hitGroups: AccessionsData["hit_groups"],
    dataIndex: number,
  ): { name: string; data: [string, string | number][] }[] => {
    // hitObj format:
    //   [numContigs, numReads, contigR, hitGroupStart, hitGroupEnd, alignmentLength,
    //    percentId, numMismatches, numGaps, binIndex]
    const hitObj = hitGroups[dataIndex];

    const numContigs = hitObj[0];
    const numReads = hitObj[1];

    const multipleHits = numContigs + numReads > 1;

    // Determine which names and counts we display based on the composition of the hit group.
    let name: string = null;
    let counts = [];

    if (numContigs > 0 && numReads > 0) {
      name = "Aggregated NT Contigs and NT Reads";
      counts = [
        ["# NT Contigs", numContigs],
        ["# Loose NT Reads", numReads],
        ["NT Contig Read Count", hitObj[2]],
      ];
    } else if (numReads > 1) {
      name = "Aggregated Loose NT Reads";
      counts = [["# Loose NT Reads", numReads]];
    } else if (numReads === 1) {
      name = "Loose NT Read";
    } else if (numContigs > 1) {
      name = "Aggregated Contigs";
      counts = [
        ["# NT Contigs", numContigs],
        ["NT Contig Read Count", hitObj[2]],
      ];
    } else if (numContigs === 1) {
      name = "NT Contig";
      counts = [["NT Contig Read Count", hitObj[2]]];
    }

    const averagePrefix = multipleHits ? "Avg. " : "";

    return [
      {
        name,
        data: [
          ...counts,
          [
            "Reference Alignment Range",
            // \u2013 is en-dash
            `${Math.round(hitObj[3])}\u2013${Math.round(hitObj[4])}`,
          ],
          [averagePrefix + "Alignment Length", hitObj[5]],
          [averagePrefix + "Percentage Matched", formatPercent(hitObj[6])],
          [averagePrefix + "# Mismatches", hitObj[7]],
          [averagePrefix + "# Gaps", hitObj[8]],
        ],
      },
    ];
  },
);

// Select all hit groups with at least one aggregated contig.
export const selectContigsFromHitGroups = memoize(
  (hitGroups: AccessionsData["hit_groups"]): AccessionsData["hit_groups"] =>
    filter(hitGroup => hitGroup[0] > 0, hitGroups),
);

// Select all hit groups with at least one aggregated read.
export const selectReadsFromHitGroups = memoize(
  (hitGroups: AccessionsData["hit_groups"]): AccessionsData["hit_groups"] =>
    filter(hitGroup => hitGroup[1] > 0, hitGroups),
);

export const generateCoverageVizData = (
  coverageData: AccessionsData["coverage"],
  coverageBinSize: number,
) =>
  coverageData.map(valueArr => ({
    x0: valueArr[0] * coverageBinSize,
    length: valueArr[1], // Actually the height. This is a d3-histogram naming convention.
  }));

export const generateContigReadVizData = (
  hitGroups: AccessionsData["hit_groups"],
  coverageBinSize: number,
) => {
  // hitObj format:
  //   [numContigs, numReads, contigR, hitGroupStart, hitGroupEnd, alignmentLength,
  //    percentId, numMismatches, numGaps, binIndex, contigByteranges]
  const getDisplayNumbers = (hitObj: Hit) => {
    // If the hit range for a single hit is too small, display the bin that they're in instead.
    // If there are multiple hits, display the bin even if the hits extend outside the bin, to prevent overlapping.
    if (
      Math.abs(hitObj[4] - hitObj[3]) < coverageBinSize ||
      hitObj[0] + hitObj[1] > 1
    ) {
      return [hitObj[9] * coverageBinSize, (hitObj[9] + 1) * coverageBinSize];
    }

    return [hitObj[3], hitObj[4]];
  };

  return hitGroups.map(hit => getDisplayNumbers(hit));
};

// Sort by score descending.
export const getSortedAccessionSummaries = (
  data: CoverageVizBottomSidebarProps["params"]["accessionData"],
): AccessionsSummary[] =>
  sortBy(summary => -summary.score, data.best_accessions);
