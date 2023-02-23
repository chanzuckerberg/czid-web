import { sample } from "lodash";
import { Workflow } from "../types/workflow";
import { getAFullDateInThePast, getFixture, getRandomNumber } from "./common";

const yesOrNo = ["Yes", "No"];
const zeroOrOne = [0, 1];
const statuses = ["COMPLETE", "FAILED"];
const metadataFixture = getFixture("metadata");

/**
 *
 * @param workflowName Function generated workflow data for stubbing the response
 * for workflow API call
 * @param projectId project ID for samples in the wrokflow
 * @param sampleName name of the sample
 * @returns Workflow object that will be passed to the mock service
 */
export function generateWorkflowData(
  workflowName: string,
  projectId: number,
  sampleName: string,
): Workflow {
  const min = 1;
  const max = 5;

  return {
    id: getRandomNumber(1000, 9999),
    workflow: workflowName,
    created_at: getAFullDateInThePast(0, 5, true),
    status: sample(statuses) as string,
    cached_results: {
      quality_metrics: {
        total_reads: getRandomNumber(100, 999),
        qc_percent: 83.24420677361854,
        adjusted_remaining_reads: getRandomNumber(100, 999),
        compression_ratio: 1.0354767184035476,
        total_ercc_reads: getRandomNumber(min, max),
        fraction_subsampled: 1.0,
        insert_size_mean: undefined,
        insert_size_standard_deviation: undefined,
        percent_remaining: 51.8716577540107,
      },
    },
    inputs: {
      accession_id: undefined,
      accession_name: undefined,
      medaka_model: undefined,
      taxon_name: undefined,
      technology: undefined,
      wetlab_protocol: undefined,
      ref_fasta: undefined,
      primer_bed: undefined,
    },
    sample: {
      info: {
        id: getRandomNumber(10000, 99999),
        created_at: getAFullDateInThePast(0, 5, true),
        host_genome_name: sample(metadataFixture["Host Genus Species"]),
        name: sampleName,
        private_until: getAFullDateInThePast(0, 5, true),
        project_id: projectId,
        sample_notes: undefined,
        public: sample(zeroOrOne) as number,
      },
      metadata: {
        collection_date: getAFullDateInThePast(0, 5),
        collection_location_v2: {
          name: "Colombia",
          geo_level: "country",
          country_name: "Colombia",
          state_name: "",
          subdivision_name: "",
          city_name: "",
          lat: 2.89,
          lng: -73.78,
          country_id: 54,
          state_id: undefined,
          subdivision_id: undefined,
          city_id: undefined,
        },
        nucleotide_type: "RNA",
        sample_type: "Mixed Tissue",
        water_control: sample(yesOrNo) as string,
      },
      project_name: "QA",
      uploader: {
        name: "CZID Test Account",
        id: 403,
      },
    },
  };
}
