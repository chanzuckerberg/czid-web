import { expect, test } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { getMetadata, getMetadataFile } from "../../utils/sample";
import { Metadata } from "../../types/metadata";

dotenv.config({ path: path.resolve(`.env.${process.env.NODE_ENV}`) });

const defaults: Metadata = {
  "Sample Name": "Illumina-73725",
  "Host Organism": "Madagascan Rousettes",
  "Sample Type": "Plasma",
  "Collection Date": "2022-10",
  "Water Control": "No",
  "Collection Location": "North Elianefurt",
  "Host Age": 43,
  "Host ID": "jeNhTLicCl",
  "RNA / DNA Input(ng)": 97,
  "Host Genus Species": "Tribe Aedeomyiini",
  "Ct Value": 97,
};

/**
 * These are demo tests to verify that the utilities to generate sample metadata works.
 * Should be delete once we have tests that consume these utilities
 */
test.describe("AMR sample upload tests", () => {
  test("Should generate sample metadata file", async () => {
    const analysisType = "Illumina";
    const metadata = getMetadataFile(analysisType);
    expect(metadata.length).toBeGreaterThan(0);
  });
  test("Should generate sample metadata", async () => {
    const analysisType = "Illumina";
    const metadata = getMetadata(analysisType, defaults);
    expect(metadata).not.toBeNull;
  });
});
