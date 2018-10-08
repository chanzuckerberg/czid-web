import React from "react";
import Moment from "react-moment";

export function DateParser(date) {
  return <Moment fromNow date={date} />;
}

export const SAMPLE_FIELDS = [
  { name: "name", label: "Name" },
  { name: "project_name", label: "Project" },
  {
    name: "created_at",
    label: "Upload Date",
    parser: DateParser
  },
  { name: "sample_location", label: "Location" },
  { name: "sample_date", label: "Collection date" },
  { name: "sample_tissue", label: "Tissue type" },
  { name: "sample_template", label: "Nucleotide type" },
  {
    name: "sample_library",
    label: "Library prep",
    description: "Type of library preparation protocol (e.g. Nextera)"
  },
  {
    name: "sample_sequencer",
    label: "Sequencer",
    description: "e.g. Illumina NovaSeq"
  },
  { name: "sample_unique_id", label: "Unique ID" },
  { name: "sample_input_pg", label: "RNA/DNA input (pg)" },
  { name: "sample_batch", label: "Batch (#)" },
  { name: "sample_diagnosis", label: "Clinical diagnosis" },
  {
    name: "sample_organism",
    label: "Known organisms",
    description: "Known hits that may or may not have been in this report"
  },
  {
    name: "sample_detection",
    label: "Detection method",
    description: "Method for detecting known organisms"
  },
  { name: "sample_notes", label: "Notes" },
  {
    name: "confirmed_names",
    label: "Manually confirmed hits (from Report tab)"
  }
];
