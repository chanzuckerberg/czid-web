import { SEQUENCING_PLATFORMS } from "@e2e/constants/common";
import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test } from "@playwright/test";

type runOptions = {
  hostOrganism?: string;
  sampleTissueType?: string;
  taxon?: string;
  collectionLocation?: string;
  includeTrimPrimer?: boolean;
  runPipeline?: boolean;
  waitForPipeline?: boolean;
  sequencingPlatform?: string;
};

export async function setupSamples(page: any, project: any, sampleFiles: Array<string>, sampleNames: Array<string>, workflow: string, runOptions?: runOptions, uploadTimeout = 90_000) {
    runOptions = runOptions || {};
    const samplesPage = new SamplesPage(page);

    let samples = [];
    let ranPipeline = false;
    samples = await samplesPage.getSamples(project.name, sampleNames);
    if ((samples.length <= 0) || runOptions.runPipeline) {
      const uploadPage = new UploadPage(page);

      let inputs = await uploadPage.getRandomizedSampleInputs(sampleFiles, sampleNames);
      for (const sampleName of Object.keys(inputs)) {
        if (runOptions.hostOrganism) {
          inputs[sampleName].hostOrganism = runOptions.hostOrganism;
        }
        if (runOptions.collectionLocation) {
          inputs[sampleName].collectionLocation = runOptions.collectionLocation;
        }
        if (runOptions.sampleTissueType) {
          inputs[sampleName].sampleTissueType = runOptions.sampleTissueType;
        }
      }
      const includeTrimPrimer = runOptions.includeTrimPrimer === undefined ? true : runOptions.includeTrimPrimer;
      inputs = await uploadPage.e2eCSVSampleUpload(
        sampleFiles, project, workflow, inputs, includeTrimPrimer,
        runOptions.taxon ? runOptions.taxon : "Unknown",
        runOptions.sequencingPlatform ? runOptions.sequencingPlatform : SEQUENCING_PLATFORMS.MNGS,
        uploadTimeout
      );
      sampleNames = Object.keys(inputs);

      samples = await samplesPage.getSamples(project.name, sampleNames);
      ranPipeline = true;
    }

    if (ranPipeline && runOptions.waitForPipeline) {
      test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run
      const sampleIds = samples.map(sample => sample.id);
      await samplesPage.waitForAllSamplesComplete(sampleIds);
    }
    return samples;
  }
