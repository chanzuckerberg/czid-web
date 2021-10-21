import React from "react";
import Moment from "react-moment";
import { formatPercent } from "~/components/utils/format";

function DateParser(date) {
  return <Moment fromNow date={date} />;
}

export const SAMPLE_FIELDS = [
  { name: "name", label: "Name" },
  { name: "project_name", label: "Project" },
  {
    name: "created_at",
    label: "Upload Date",
    parser: DateParser,
  },
];

export const SAMPLE_METADATA_FIELDS = [
  "collection_location_v2",
  "collection_date",
  "sample_type",
  "nucleotide_type",
];

export const SAMPLE_METRIC_FIELDS = [
  {
    default: "See coverage viz",
    name: "coverage_breadth",
    label: "Coverage Breadth",
    parser: formatPercent,
  },
];
