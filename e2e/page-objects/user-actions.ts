import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test } from "@playwright/test";

type runOptions = {
  hostOrganism?: string;
  sampleTissueType?: string;
  taxon?: string;
  collectionLocation?: string;
  runPipeline?: boolean;
  waitForPipeline?: boolean;
};

export async function runPipelineIfNeeded(page: any, project: any, sampleFiles: Array<string>, sampleNames: Array<string>, workflow: string, runOptions?: runOptions) {
    const samplesPage = new SamplesPage(page);

    let samples = [];
    let ranPipeline = false;
    const noHostSample = await samplesPage.getSamples(project.name, sampleNames[0]);
    runOptions = runOptions || {};
    if ((noHostSample.length <= 0) || runOptions.runPipeline) {
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
      inputs = await uploadPage.e2eCSVSampleUpload(sampleFiles, project, workflow, inputs, true, runOptions.taxon ? runOptions.taxon : "Unknown");
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
