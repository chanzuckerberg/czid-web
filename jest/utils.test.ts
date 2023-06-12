import { removeLaneFromName } from "../app/assets/src/components/views/SampleUploadFlow/utils";

const TEST_CASES_ILLUMINA = [
  // Lane numbers: _L001 to _L008
  { filename: "ABC_L001", expect: "ABC" },
  { filename: "DEF_L002", expect: "DEF" },
  { filename: "GHI_L003", expect: "GHI" },
  { filename: "JKL_L004", expect: "JKL" },
  { filename: "MNO_L005", expect: "MNO" },
  { filename: "PKR_L006", expect: "PKR" },
  { filename: "STU_L007", expect: "STU" },
  { filename: "VWX_L008", expect: "VWX" },

  // If don't find a valid lane number, output the original filename
  { filename: "Sample_L009", expect: "Sample_L009" },
  { filename: "Sample_L01", expect: "Sample_L01" },
  { filename: "Sample_L1", expect: "Sample_L1" },
  { filename: "SampleL001", expect: "SampleL001" },
  { filename: "Sample", expect: "Sample" },
];

const TEST_CASES_ONT = [
  // With "_pass_" in the filename
  {
    filename: "ABC123_pass_3c3de543_0",
    expect: "ABC123_pass_3c3de543",
  },
  {
    filename: "ABC123_pass_3c3de543_1c8e7d21_0",
    expect: "ABC123_pass_3c3de543_1c8e7d21",
  },
  {
    filename: "ABC123_pass_barcode12a_1c8e7d21_0",
    expect: "ABC123_pass_barcode12a_1c8e7d21",
  },
  {
    filename: "ABC123_pass_unclassified_1c8e7d21_0",
    expect: "ABC123_pass_unclassified_1c8e7d21",
  },
  {
    filename: "ABC123_pass_barcode12a_3c3de543_1c8e7d21_0",
    expect: "ABC123_pass_barcode12a_3c3de543_1c8e7d21",
  },

  // With "fastq_runid"
  {
    filename: "fastq_runid_8905d60b_0",
    expect: "fastq_runid_8905d60b",
  },
  {
    filename: "fastq_runid_a19c719b_0_0",
    expect: "fastq_runid_a19c719b",
  },
  {
    filename: "fastq_runid_9695a623_0_0-12345",
    expect: "fastq_runid_9695a623",
  },

  // If don't find valid barcodes, output original files
  { filename: "ABC123_3c3de543_0", expect: "ABC123_3c3de543_0" },
  {
    filename: "fastq_runi_bef553dc_0",
    expect: "fastq_runi_bef553dc_0",
  },
];

// Also test the tests above with different extensions (and with no extension)
const TEST_CASES_FILE_EXTENSIONS = ["", ".fq", ".fq.gz", ".fastq", ".fastq.gz"];

describe("Lane concatenation logic", () => {
  test("Illumina data", () => {
    for (const testCase of TEST_CASES_ILLUMINA) {
      for (const extension of TEST_CASES_FILE_EXTENSIONS) {
        const filename = testCase.filename + extension;
        const expected = testCase.expect + extension;

        const outputONTEnabled = removeLaneFromName(filename, true);
        const outputONTDisabled = removeLaneFromName(filename, false);

        // Illumina file names should return the same result whether ONT concat is enabled
        expect(outputONTEnabled).toBe(expected);
        expect(outputONTDisabled).toBe(expected);
      }
    }
  });

  test("ONT data", () => {
    for (const testCase of TEST_CASES_ONT) {
      for (const extension of TEST_CASES_FILE_EXTENSIONS) {
        const filename = testCase.filename + extension;
        const expected = testCase.expect + extension;

        const outputONTEnabled = removeLaneFromName(filename, true);
        const outputONTDisabled = removeLaneFromName(filename, false);

        // If ONT concatenation is disabled, should return the original filename
        expect(outputONTEnabled).toBe(expected);
        expect(outputONTDisabled).toBe(filename);
      }
    }
  });
});
