import { SARS_COV_2_ACCESSION_ID } from "~/components/views/SampleView/utils";
import {
  SARS_COV_2_CONSENSUS_GENOME_DOC_LINK,
  VIRAL_CONSENSUS_GENOME_DOC_LINK,
} from "~utils/documentationLinks";

export const getConsensusGenomeHelpLink = (accession_id: string) => {
  return accession_id === SARS_COV_2_ACCESSION_ID
    ? SARS_COV_2_CONSENSUS_GENOME_DOC_LINK
    : VIRAL_CONSENSUS_GENOME_DOC_LINK;
};
