import { CountTypes } from "~/components/views/SampleView/components/ModalManager/components/BlastModals/constants";
import { get, postWithCSRF } from "./core";

export const fetchLongestContigsForTaxonId = ({
  countType = CountTypes.NT,
  sampleId,
  pipelineVersion,
  taxonId,
}: $TSFixMe) =>
  get(`/samples/${sampleId}/taxid_contigs_for_blast.json`, {
    params: {
      taxid: taxonId,
      pipeline_version: pipelineVersion,
      count_type: countType,
    },
  });

export const fetchLongestReadsForTaxonId = ({
  countType = CountTypes.NT,
  sampleId,
  pipelineVersion,
  taxonId,
  taxonLevel,
}: $TSFixMe) =>
  get(`/samples/${sampleId}/taxon_five_longest_reads.json`, {
    params: {
      taxid: taxonId,
      tax_level: taxonLevel,
      pipeline_version: pipelineVersion,
      count_type: countType,
    },
  });

export const createAnnotation = ({
  pipelineRunId,
  taxId,
  annotationType,
}: $TSFixMe) =>
  postWithCSRF(`/annotations.json`, {
    pipeline_run_id: pipelineRunId,
    tax_id: taxId,
    content: annotationType,
  });
