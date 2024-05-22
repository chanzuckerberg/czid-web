import { filter, some, zip } from "lodash/fp";

class PhyloTreeChecks {
  static RECOMMENDED_MIN_READS: number;
  static MIN_READS: number;
  static MIN_SAMPLES: number;
  static MAX_SAMPLES: number;
  static passesCreateCondition(ntReads: number, nrReads: number) {
    return (
      ntReads >= PhyloTreeChecks.MIN_READS ||
      nrReads >= PhyloTreeChecks.MIN_READS
    );
  }

  static isNumberOfSamplesValid(sampleCount: number) {
    return (
      sampleCount >= PhyloTreeChecks.MIN_SAMPLES &&
      sampleCount <= PhyloTreeChecks.MAX_SAMPLES
    );
  }

  static hasSamplesWithFewReads(nReadsArray: number[]) {
    return some(
      nReads => nReads < PhyloTreeChecks.RECOMMENDED_MIN_READS,
      nReadsArray,
    );
  }

  // Counts number of samples with few reads in EITHER of the arrays
  static countSamplesWithFewReads(
    ntReadsArray: number[],
    nrReadsArray: number[],
  ) {
    return filter(
      (nReads: number[]) => PhyloTreeChecks.hasSamplesWithFewReads(nReads),
      zip(ntReadsArray, nrReadsArray),
    ).length;
  }
}

PhyloTreeChecks.MIN_READS = 1;
PhyloTreeChecks.RECOMMENDED_MIN_READS = 5;
PhyloTreeChecks.MIN_SAMPLES = 4;
PhyloTreeChecks.MAX_SAMPLES = 100;

export default PhyloTreeChecks;
