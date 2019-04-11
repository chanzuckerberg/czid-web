import memoize from "memoize-one";

// Gets called on every mouse move, so need to memoize.
export const getHistogramTooltipData = memoize(
  (accessionData, coverageIndex) => {
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
            `${Math.round(coverageObj[0] * binSize)} - ${Math.round(
              (coverageObj[0] + 1) * binSize
            )}`
          ],
          ["Average Coverage Depth", coverageObj[1]],
          ["Coverage Breadth", coverageObj[2]],
          ["Overlapping Contigs", coverageObj[3]],
          ["Overlapping Reads", coverageObj[4]]
        ]
      }
    ];
  }
);

// Gets called on every mouse move, so need to memoize.
export const getGenomeVizTooltipData = memoize((accessionData, dataIndex) => {
  // hitObj format:
  //   [numContigs, numReads, contigR, hitGroupStart, hitGroupEnd, alignmentLength,
  //    percentId, numMismatches, numGaps, binIndex]
  const hitObj = accessionData.hit_groups[dataIndex];

  const numContigs = hitObj[0];
  const numReads = hitObj[1];

  const multipleHits = numContigs + numReads > 1;

  // Determine which names and counts we display based on the composition of the hit group.
  let name = null;
  let counts = [];

  if (numContigs > 0 && numReads > 0) {
    name = "Aggregated Contigs and Reads";
    counts = [
      ["# Contigs", numContigs],
      ["# Reads", numReads],
      ["Contig Read Count", hitObj[2]]
    ];
  } else if (numReads > 1) {
    name = "Aggregated Reads";
    counts = [["# Reads", numReads]];
  } else if (numReads == 1) {
    name = "Read";
  } else if (numContigs > 1) {
    name = "Aggregated Contigs";
    counts = [["# Contigs", numContigs], ["Read Count", hitObj[2]]];
  } else if (numContigs == 1) {
    name = "Contig";
    counts = [["Read Count", hitObj[2]]];
  }

  const averagePrefix = multipleHits ? "Avg. " : "";

  return [
    {
      name,
      data: [
        ...counts,
        [
          "Reference Alignment Range",
          `${Math.round(hitObj[3])} - ${Math.round(hitObj[4])}`
        ],
        [averagePrefix + "Alignment Length", hitObj[5]],
        [averagePrefix + "Percentage Matched", hitObj[6]],
        [averagePrefix + "# Mismatches", hitObj[7]],
        [averagePrefix + "# Gaps", hitObj[8]]
      ]
    }
  ];
});

export const generateCoverageVizData = (coverageData, coverageBinSize) =>
  coverageData.map(valueArr => ({
    x0: valueArr[0] * coverageBinSize,
    length: valueArr[1] // Actually the height. This is a d3-histogram naming convention.
  }));

export const generateContigReadVizData = (hitGroups, coverageBinSize) => {
  // hitObj format:
  //   [numContigs, numReads, contigR, hitGroupStart, hitGroupEnd, alignmentLength,
  //    percentId, numMismatches, numGaps, binIndex]
  const getDisplayNumbers = hitObj => {
    // hasContig is used to pick the correct color in the GenomeViz
    const hasContig = hitObj[0] > 0 ? 1 : 0;

    // If the hit range for a single hit is too small, display the bin that they're in instead.
    // If there are multiple hits, display the bin even if the hits extend outside the bin, to prevent overlapping.
    if (
      Math.abs(hitObj[4] - hitObj[3]) < coverageBinSize ||
      hitObj[0] + hitObj[1] > 1
    ) {
      return [
        hitObj[9] * coverageBinSize,
        (hitObj[9] + 1) * coverageBinSize,
        hasContig
      ];
    }

    return [hitObj[3], hitObj[4], hasContig];
  };

  return hitGroups.map(hit => getDisplayNumbers(hit));
};
