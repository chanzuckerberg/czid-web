// TODO(mark): Add information about the sample input files and host genome into the table.
// TODO(mark): Add UI for upload progress and status.
import { cloneDeep, isUndefined } from "lodash/fp";
import React from "react";
import { HOST_GENOME_SYNONYMS } from "~/components/common/Metadata/constants";
import { returnHipaaCompliantMetadata } from "~/components/utils/metadata";
import DataTable from "~/components/visualizations/table/DataTable";
import cs from "./metadata_upload_modal.scss";
import { ProjectSample } from "./MetadataUploadModal";

interface ReviewPageProps {
  metadata?: {
    rows: { sample_name: string; [key: string]: string }[];
    headers: string[];
  };
  samples?: ProjectSample[];
  title?: JSX.Element;
}

const ReviewPage = ({ metadata, samples }: ReviewPageProps) => {
  if (isUndefined(metadata) || isUndefined(samples)) return null;

  // Create a copy of metadata that hides hipaa sensitive data
  const metadataRows = cloneDeep(metadata.rows);
  const cleanMetadataRows = metadataRows.map(sample => {
    const hostGenomeName = HOST_GENOME_SYNONYMS.reduce(
      (match, hostGenome) => sample[hostGenome] || match,
      null,
    );
    const isHuman = hostGenomeName && hostGenomeName.toLowerCase() === "human";
    const containsHostAge = "Host Age" in sample;
    if (isHuman && containsHostAge) {
      // returnHipaaCompliantMetadata requires metadataType to be defined using underscore notation
      sample["Host Age"] = returnHipaaCompliantMetadata(
        "host_age",
        sample["Host Age"],
      );
    }
    return sample;
  });

  return (
    <div className={cs.tableContainer}>
      <DataTable
        className={cs.metadataTable}
        columns={metadata.headers}
        data={cleanMetadataRows}
        columnWidth={120}
      />
    </div>
  );
};

export default ReviewPage;
