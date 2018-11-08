export const METADATA_SECTIONS = [
  {
    name: "Sample Info",
    keys: [
      "unique_id",
      "sample_type",
      "nucleotide_type",
      "collection_date",
      "collection_location",
      "collected_by"
    ]
  },
  {
    name: "Donor Info",
    keys: [
      "age",
      "gender",
      "race",
      "primary_diagnosis",
      "antibiotic_administered",
      "admission_date",
      "admission_type"
    ]
  },
  {
    name: "Infection Info",
    keys: [
      "other_infections",
      "comorbidity",
      "known_organism",
      "infection_class",
      "detection_method"
    ]
  },
  {
    name: "Sequencing Info",
    keys: [
      "library_prep",
      "sequencer",
      "rna_dna_input",
      "library_prep_batch",
      "extraction_batch"
    ]
  }
];

export const SAMPLE_ADDITIONAL_INFO = [
  {
    name: "Sample Name",
    key: "name"
  },
  {
    name: "Project",
    key: "project_name"
  },
  {
    name: "Upload Date",
    key: "upload_date"
  },
  {
    name: "Host",
    key: "host_genome_name"
  }
];

export const PIPELINE_INFO_FIELDS = [
  {
    name: "Total Reads",
    key: "totalReads"
  },
  {
    name: "ERCC Reads",
    key: "totalErccReads"
  },
  {
    name: "Non-host Reads",
    key: "nonhostReads"
  },
  {
    name: "Unmapped Reads",
    key: "unmappedReads"
  },
  {
    name: "Passed Quality Control",
    key: "qcPercent"
  },
  {
    name: "Compression Ratio",
    key: "compressionRatio"
  },
  {
    name: "Date Processed",
    key: "lastProcessedAt"
  }
];
