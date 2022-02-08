import { filter, some, zip } from "lodash/fp";

class PhyloTreeChecks {
  static passesCreateCondition(ntReads, nrReads) {
    return (
      ntReads >= PhyloTreeChecks.MIN_READS ||
      nrReads >= PhyloTreeChecks.MIN_READS
    );
  }

  static isNumberOfSamplesValid(sampleCount) {
    return (
      sampleCount >= PhyloTreeChecks.MIN_SAMPLES &&
      sampleCount <= PhyloTreeChecks.MAX_SAMPLES
    );
  }

  static hasSamplesWithFewReads(nReadsArray) {
    return some(
      nReads => nReads < PhyloTreeChecks.RECOMMENDED_MIN_READS,
      nReadsArray,
    );
  }

  // Counts number of samples with few reads in EITHER of the arrays
  static countSamplesWithFewReads(ntReadsArray, nrReadsArray) {
    return filter(
      nReads => PhyloTreeChecks.hasSamplesWithFewReads(nReads),
      zip(ntReadsArray, nrReadsArray),
    ).length;
  }
}

PhyloTreeChecks.MIN_READS = 1;
PhyloTreeChecks.RECOMMENDED_MIN_READS = 5;
PhyloTreeChecks.MIN_SAMPLES = 4;
PhyloTreeChecks.MAX_SAMPLES = 100;

export default PhyloTreeChecks;
