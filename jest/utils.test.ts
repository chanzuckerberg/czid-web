import { removeLaneFromName } from "../app/assets/src/components/views/SampleUploadFlow/utils";

const TEST_CASES_ILLUMINA = [
  // Lane numbers: _L001 to _L008
  { filename: "ABC_L001.fastq", expect: "ABC.fastq" },
  { filename: "DEF_L002.fastq", expect: "DEF.fastq" },
  { filename: "GHI_L003.fastq", expect: "GHI.fastq" },
  { filename: "JKL_L004.fastq", expect: "JKL.fastq" },
  { filename: "MNO_L005.fastq", expect: "MNO.fastq" },
  { filename: "PKR_L006.fastq", expect: "PKR.fastq" },
  { filename: "STU_L007.fastq", expect: "STU.fastq" },
  { filename: "VWX_L008.fastq", expect: "VWX.fastq" },

  // If don't find a valid lane number, output the original filename
  { filename: "Sample_L009.fastq", expect: "Sample_L009.fastq" },
  { filename: "Sample_L01.fastq", expect: "Sample_L01.fastq" },
  { filename: "Sample_L1.fastq", expect: "Sample_L1.fastq" },
  { filename: "SampleL001.fastq", expect: "SampleL001.fastq" },
  { filename: "Sample.fastq", expect: "Sample.fastq" },
];

const TEST_CASES_ONT = [
  // With "_pass_" in the filename
  {
    filename: "ABC123_pass_3c3de543_0.fastq",
    expect: "ABC123_pass_3c3de543.fastq",
  },
  {
    filename: "ABC123_pass_3c3de543_1c8e7d21_0.fastq",
    expect: "ABC123_pass_3c3de543_1c8e7d21.fastq",
  },
  {
    filename: "ABC123_pass_barcode12a_1c8e7d21_0.fastq",
    expect: "ABC123_pass_barcode12a_1c8e7d21.fastq",
  },
  {
    filename: "ABC123_pass_unclassified_1c8e7d21_0.fastq",
    expect: "ABC123_pass_unclassified_1c8e7d21.fastq",
  },
  {
    filename: "ABC123_pass_barcode12a_3c3de543_1c8e7d21_0.fastq",
    expect: "ABC123_pass_barcode12a_3c3de543_1c8e7d21.fastq",
  },

  // With "fastq_runid"
  {
    filename: "fastq_runid_8905d60b_0.fastq",
    expect: "fastq_runid_8905d60b.fastq",
  },
  {
    filename: "fastq_runid_a19c719b_0_0.fastq",
    expect: "fastq_runid_a19c719b.fastq",
  },
  {
    filename: "fastq_runid_9695a623_0_0-12345.fastq",
    expect: "fastq_runid_9695a623.fastq",
  },

  // If don't find valid barcodes, output original files
  { filename: "ABC123_3c3de543_0.fastq", expect: "ABC123_3c3de543_0.fastq" },
  {
    filename: "fastq_runi_bef553dc_0.fastq",
    expect: "fastq_runi_bef553dc_0.fastq",
  },
];

describe("Lane concatenation logic", () => {
  test("Illumina data", () => {
    for (const testCase of TEST_CASES_ILLUMINA) {
      const outputONTEnabled = removeLaneFromName(testCase.filename, true);
      const outputONTDisabled = removeLaneFromName(testCase.filename, false);

      // Illumina file names should return the same result whether ONT concat is enabled
      expect(outputONTEnabled).toBe(testCase.expect);
      expect(outputONTDisabled).toBe(testCase.expect);
    }
  });

  test("ONT data", () => {
    for (const testCase of TEST_CASES_ONT) {
      const outputONTEnabled = removeLaneFromName(testCase.filename, true);
      const outputONTDisabled = removeLaneFromName(testCase.filename, false);

      // If ONT concatenation is disabled, should return the original filename
      expect(outputONTEnabled).toBe(testCase.expect);
      expect(outputONTDisabled).toBe(testCase.filename);
    }
  });
});
