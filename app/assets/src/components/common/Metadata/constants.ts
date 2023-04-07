import { WORKFLOWS } from "~/components/utils/workflows";

// metadataFields that should not be available for input for a workflow
export const METADATA_FIELDS_UNAVAILABLE_BY_WORKFLOW = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: ["ct_value"],
  [WORKFLOWS.AMR.value]: ["ct_value"],
  [WORKFLOWS.CONSENSUS_GENOME.value]: [],
};

export const FIELDS_THAT_SHOULD_NOT_HAVE_NEGATIVE_INPUT = new Set([
  "ct_value",
  "host_age",
  "sample_unit",
]);

export const FIELDS_THAT_HAVE_MAX_INPUT = {
  host_age: 90,
};

// See HOST_GENOME_SYNONYMS in MetadataField
export const HOST_GENOME_SYNONYMS = [
  "host_genome",
  "Host Genome",
  "host_organism",
  "Host Organism",
];

export const CONCURRENT_REQUESTS_LIMIT = 20;
export const REQUEST_DELAY_MIN = 1000;
export const REQUEST_DELAY_MAX = 2000;
export const NAME_COLUMN = "Sample Name";

// When the auto-populate button is clicked, the following metadata fields will be populated with these values.
export const AUTO_POPULATE_FIELDS = {
  "Host Organism": "Human",
  sample_type: "CSF",
  nucleotide_type: "DNA",
  collection_date: "2020-05",
  collection_location_v2: "California, USA",
};

// From https://czi.quip.com/FPnbATvWSIIL/Metadata-Tooltips#AQKACA1SEBr on 2020-02-18.
// See also descriptions stored in database by MetadataField.
// NOTE: for good layout, text should be no longer than 110 chars.
export const COLUMN_HEADER_TOOLTIPS = {
  "Host Organism": "Host from which the sample was originally collected.",
  collection_date:
    "Date on which sample was originally collected. For privacy reasons, only use month and/or year for human data.",
  collection_location_v2:
    "Location from which sample was originally collected. For privacy, we do not allow city-level data for human hosts.",
  nucleotide_type:
    "Nucleotide type of sample will influence the pipeline. Nanopore does not support dRNA libraries.",
  sample_type:
    "Tissue or site from which the sample was originally collected. Suggested list is dependent on host selection.",
  water_control: "Whether or not sample is a water control.",
  collected_by: "Institution/agency that collected sample.",
  isolate: "Whether or not sample is an isolate.",
  antibiotic_administered: "Antibiotics administered to host.",
  comorbidity: "Other chronic diseases present.",
  host_age: "Age of host (in years).",
  host_genus_species: "Genus or species of host.",
  host_id: "Unique identifier for host.",
  host_race_ethnicity: "Race and-or ethnicity of host.",
  host_sex: "Sex of host.",
  immunocomp: "Information on if host was immunocompromised.",
  primary_diagnosis: "Diagnosed disease that resulted in hospital admission.",
  detection_method:
    "Detection method for the known organism identified by a clinical lab.",
  infection_class: "Class of infection.",
  known_organism: "Organism in sample detected by clinical lab.",
  library_prep: "Information on library prep kit.",
  rna_dna_input: "RNA/DNA input in nanograms.",
  sequencer: "Model of sequencer used.",
  diseases_and_conditions: "Diseases and-or conditions observed in host.",
  blood_fed: "Information about host's blood feeding.",
  gravid: "Whether or not host was gravid.",
  host_life_stage: "Life stage of host.",
  preservation_method: "Preservation method of host.",
  sample_unit: "Number of hosts in sample.",
  trap_type: "Trap type used on host.",
  ct_value:
    "The number of cycles required for the fluorescent signal to cross the background fluorescent threshold during qPCR. The value is inversely proportional to the amount of target nucleic acid.",
};
