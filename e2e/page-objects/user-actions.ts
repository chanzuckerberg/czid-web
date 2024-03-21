import { SamplesPage } from "@e2e/page-objects/samples-page";
import { UploadPage } from "@e2e/page-objects/upload-page";
import { test } from "@playwright/test";


export async function runPipelineIfNeeded(page: any, project: any, sampleFiles: Array<string>, sampleNames: Array<string>, hostOrganism: string, taxon: string, workflow: string, runPipeline = true, waitForPipeline = false) {
    const samplesPage = new SamplesPage(page);

    let samples = [];
    let ranPipeline = false;
    const noHostSample = await samplesPage.getSamples(project.name, sampleNames[0]);
    if ((noHostSample.length <= 0) || runPipeline) {
      const uploadPage = new UploadPage(page);

      let inputs = await uploadPage.getRandomizedSampleInputs(sampleFiles, sampleNames);
      for (const sampleName of Object.keys(inputs)) {
        inputs[sampleName].hostOrganism = hostOrganism;
      }
      inputs = await uploadPage.e2eCSVSampleUpload(sampleFiles, project, workflow, inputs, true, taxon);
      sampleNames = Object.keys(inputs);

      samples = await samplesPage.getSamples(project.name, sampleNames);
      ranPipeline = true;
    }

    if (ranPipeline && waitForPipeline) {
      test.setTimeout(60 * 1000 * 20); // Inclease the test runtime to let the piepline run
      const sampleIds = samples.map(sample => sample.id);
      await samplesPage.waitForAllSamplesComplete(sampleIds);
    }
    return samples;
  }
