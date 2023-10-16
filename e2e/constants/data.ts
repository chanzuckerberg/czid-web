// todo: faulty samples to be replaced: 25528, 25986, 26101
// todo: tests with those sample ids need fixing
export const TEST_SAMPLES: Record<string, Record<number, string>> = {
  STAGING: {
    25307: "Sample Name-94",
    24329: "RNAEnr_10e4_viralcopies_RVOPv2_iSeq",
    25983: "DO_NOT_DELETE_norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6_",
    25745: "norg_13__nacc_35__uniform_weight_per_organism__hiseq_reads__v10__7",
    26022: "28A-idseq-mosq.2to4mil_subsample",
    25987: "RR004_water_2_S23B",
    25609: "RR004_water_2_S23A",
    25746: "add a CG and check delete",
    25747: "add cg and check delete 2",
  },
  LOCAL: {
    25307: "Sample-25307",
    24329: "Sample-24329",
    25983: "Sample-25983",
    25745: "Sample-25745",
    26022: "Sample-26022",
    25987: "Sample-25987",
    25609: "Sample-25609",
    25746: "Sample-25746",
    25747: "Sample-25747",
  },
  CI: {
    25307: "Sample-25307",
    24329: "Sample-24329",
    25983: "Sample-25983",
    25745: "Sample-25745",
    26022: "Sample-26022",
    25987: "Sample-25987",
    25609: "Sample-25609",
    25746: "Sample-25746",
    25747: "Sample-25747",
  },
};

export const PROJECT_IDS: Record<string, number[]> = {
  STAGING: [875],
  LOCAL: [],
  CI: [],
};
export const TAXON_IDS: Record<string, number[]> = {
  STAGING: [573, 694003],
  LOCAL: [],
  CI: [],
};
export const PHYLOTREE_IDS: Record<string, number[]> = {
  STAGING: [244],
  LOCAL: [],
  CI: [],
};
