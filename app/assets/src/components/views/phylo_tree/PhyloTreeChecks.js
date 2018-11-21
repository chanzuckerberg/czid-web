const MIN_READS = 1;

class PhyloTreeChecks {
  static passesCreateCondition(ntReads, nrReads) {
    return ntReads >= MIN_READS || nrReads >= MIN_READS;
  }
}

export default PhyloTreeChecks;
