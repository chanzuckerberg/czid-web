import React from "react";
import Moment from "react-moment";

function DateParser(date) {
  return <Moment fromNow date={date} />;
}

export const SAMPLE_FIELDS = [
  { name: "name", label: "Name" },
  { name: "project_name", label: "Project" },
  {
    name: "created_at",
    label: "Upload Date",
    parser: DateParser
  }
];

export const SAMPLE_METADATA_FIELDS = [
  "collection_location",
  "collection_date",
  "sample_type",
  "nucleotide_type"
];
