import * as fsPromises from "fs/promises";
import * as readline from "readline";
import { expect, Download } from "@playwright/test";
import { parseCSV } from "./parsers";
import { AssertionCollector } from "./assertion-collector";

const AMR_TABLE_EXACT_MATCH_FIELDS = ["gene",
  "gene_family",
  "drug_class",
  "high_level_drug_class",
  "mechanism",
  "model",
  "read_species",
  "cutoff",
  "contig_species"
];

/**
 *
 * @param outputDir directory where output file is stored
 * @param filename name of fixture file
 * @returns full path to output fixture file
 */
export function getFixtureOutputPath(outputDir: string, filename: string) {
  return `./fixtures/outputs/${outputDir}/${filename}`;
};

/**
 *
 * @param downloadName
 * @param fixtureDir
 * @param sampleName
 * @param baselineName
 * @returns path to fixture for downloads where the name is dynamic, typically when the sample or other id is included in the name
 */
export function getFixturePathForSampleDownload(
  downloadName: string,
  fixtureDir: string,
  sampleName: string,
  baselineName: string
): string {
  if (sampleName && downloadName.startsWith(sampleName)) {
    // This name is dynamic
    const regex = new RegExp(`${baselineName}_[\\d_]*`);
    downloadName = downloadName.replace(regex, `${baselineName}_`);
  }

  return getFixtureOutputPath(fixtureDir, downloadName);
};

/**
 *
 * @param filePath
 * @param {character}
 * @returns number of lines in file that contain the given character
 */
async function getNumberOfLinesWithCharacterInFile(filePath: string, character = null) {
  try {
    const fileHandle = await fsPromises.open(filePath, 'r');
    const fileStream = fileHandle.createReadStream();

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let numLines = 0;
    for await (const line of rl) {
      if (!character || (character && line.includes(character)))
        numLines++;
    }

    await fileHandle.close();

    return numLines;
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    throw err;
  }
}

/**
 *
 * @param filePath
 * @returns number of lines in given file
 */
export async function getNumberOfLinesInFile(filePath: string) {
  // This rule is deprecated in more recent verions of eslint
  // eslint-disable-next-line no-return-await
  return await getNumberOfLinesWithCharacterInFile(filePath);
}

// #region fasta file comparison util functions
/**
 * Returns number of sequences in a fasta file by counting lines with the character ">".
 * Uses a stream to avoid loading entire file into memory.
 * @param filePath path to file
 * @returns number of sequences in the file
 */
async function getNumberofSequencesInFasta(filePath: string) {
  const SEQUENCE_NAME_PREFIX = ">";
  // This rule is deprecated in more recent verions of eslint
  // eslint-disable-next-line no-return-await
  return await getNumberOfLinesWithCharacterInFile(filePath, SEQUENCE_NAME_PREFIX);
}

/**
 * Get number of sequences in a downloaded fasta file
 * @param download file download to count sequences
 * @returns number of sequences in downloaded fasta file
 */
export async function numSequencesInDownloadFasta(download: Download) {
  const downloadPath = await download.path();
  // This rule is deprecated in more recent verions of eslint
  // eslint-disable-next-line no-return-await
  return await getNumberofSequencesInFasta(downloadPath);
}

/**
 * Get number of sequences in a fixture for a downloaded fasta file.  Takes optional sample and baseline names to handle dynamic filenames.
 * @param download file download to count sequences
 * @param fixtureDir path to fixtures for download
 * @param {sampleName} name of sample
 * @param {baselineName} name of baseline
 * @returns
 */
export async function numSequencesInDownloadFixtureFasta(
  download: Download,
  fixtureDir: string,
  sampleName = null,
  baselineName = null
) {
  const downloadName = await download.suggestedFilename();
  const fixturePath = getFixturePathForSampleDownload(downloadName, fixtureDir, sampleName, baselineName);
  // This rule is deprecated in more recent verions of eslint
  // eslint-disable-next-line no-return-await
  return await getNumberofSequencesInFasta(fixturePath);
}
// #endregion fasta file comparison util functions

// #region CSV comparison util functions
export async function parseCSVArray(arrayValStr: string) {
  const values = [];
  for (const value of arrayValStr.split(";")) {
    if (value.trim()) {
      values.push(value.trim());
    }
  }
  return values.sort();
}

async function getUpperAndLowerBounds(expectedValue: number, tolerance = 0.10) {
  const lowerBound = expectedValue * (1 - tolerance);
  const upperBound = expectedValue * (1 + tolerance);
  return expectedValue >= 0 ? {lowerBound, upperBound} : { lowerBound: upperBound, upperBound: lowerBound };
}

export async function verifyUpperAndLowerBounds(actual: any, expected: any, errorMsg = "", collector: AssertionCollector) {
  const expectedRange = await getUpperAndLowerBounds(expected);
  collector.collect(async () => expect(actual).toBeGreaterThanOrEqual(expectedRange.lowerBound), errorMsg);
  collector.collect(async () => expect(actual).toBeLessThanOrEqual(expectedRange.upperBound), errorMsg);
}

/**
 *
 * @param contentName
 * @param actualOutputData
 * @param expectedBaselineData
 * @param collector
 * @param {csvParsingOptions}
 * @returns AssertionCollector with the results of comparing a CSV file to a fixture
 */
export async function compareCSV(
  contentName: string,
  actualOutputData: any,
  expectedBaselineData: any,
  collector: AssertionCollector,
  csvParsingOptions = {},
) {
  const defaultCSVParsingoptions = { columns: true, skip_empty_lines: true };
  const options = { ...defaultCSVParsingoptions, ...csvParsingOptions };
  const actualData = await parseCSV(actualOutputData, options);
  const expectedData = await parseCSV(expectedBaselineData, options);

  collector.collect(async () => expect(actualData.length).toEqual(expectedData.length), `${contentName} length`);
  for (const i in expectedData) {
    const actualRow = actualData[i];
    const expectedRow = expectedData[i];
    collector.collect(async () => expect(actualRow).toBeDefined(), `${contentName} row ${i} undefined`);
    const errorMsg = `${contentName} row ${i} `;
    if (actualRow === undefined) {
      continue;
    }

    for (const key of Object.keys(expectedRow)) {
      const actualValue = actualRow[key];
      const expectedValue = expectedRow[key];

      if (await expectedValue.includes(";")) {
        const expectedArray = await parseCSVArray(expectedValue);
        const actualArray = await parseCSVArray(actualValue);

        collector.collect(async () => expect(actualArray).toEqual(expectedArray), errorMsg + key);
      } else if (AMR_TABLE_EXACT_MATCH_FIELDS.includes(key) || !expectedValue) {
        collector.collect(async () => expect(actualValue).toEqual(expectedValue), errorMsg + key);
      } else if (expectedValue.startsWith("[")) {
        if (!actualValue.startsWith("[")) {
          collector.collect(async () => expect(actualValue).toEqual(expectedValue), errorMsg + key);
        } else {

          const expectedArray = await JSON.parse(expectedValue);
          const actualArray = await JSON.parse(actualValue);
          for (const i in expectedArray) {
            await verifyUpperAndLowerBounds(
              parseFloat(actualArray[i]),
              parseFloat(expectedArray[i]), errorMsg + key,
              collector,
            );
          }
        }
      } else {
        await verifyUpperAndLowerBounds(parseFloat(actualValue), parseFloat(expectedValue) , errorMsg + key, collector);
      }
    }
  }
};

export async function compareCSVDownloadToFixture(
  download: Download,
  fixtureDir: string,
  sampleName = null,
  baselineName = null,
  csvParsingOptions = {},
): Promise<AssertionCollector> {
  const collector = new AssertionCollector();
  const downloadPath = await download.path();
  const downloadName = await download.suggestedFilename();
  const fixturePath = getFixturePathForSampleDownload(downloadName, fixtureDir, sampleName, baselineName);

  const actualOutputData = await fsPromises.readFile(downloadPath, "utf-8");
  const expectedBaselineData = await fsPromises.readFile(fixturePath, "utf-8");
  await compareCSV(downloadName, actualOutputData, expectedBaselineData, collector, csvParsingOptions);
  return collector;
};
// #endregion CSV comparison util functions
