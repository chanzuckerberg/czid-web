const MIN_READS = 100;

class PhyloTreeChecks {
  static passesCreateCondition(ntReads, nrReads) {
    return ntReads >= MIN_READS || nrReads >= MIN_READS;
  }
}

export default PhyloTreeChecks;
