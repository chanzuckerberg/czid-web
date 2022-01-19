// TODO(mark): Add information about the sample input files and host genome into the table.
// TODO(mark): Add UI for upload progress and status.
import { cloneDeep, isUndefined, keyBy } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { returnHipaaCompliantMetadata } from "~/components/utils/metadata";
import DataTable from "~/components/visualizations/table/DataTable";
import cs from "./metadata_upload_modal.scss";

const ReviewPage = ({ metadata, samples }) => {
  if (isUndefined(metadata) || isUndefined(samples)) return null;

  const samplesByName = keyBy("name", samples);

  // Create a copy of metadata that hides hipaa sensitive data
  const metadataRows = cloneDeep(metadata.rows);
  const cleanMetadataRows = metadataRows.map(sample => {
    const sampleName = sample["sample_name"];
    const isHuman = samplesByName[sampleName]["host_genome_id"] === 1;
    const containsHostAge = "host_age" in sample;
    if (isHuman && containsHostAge) {
      sample["host_age"] = returnHipaaCompliantMetadata(
        "host_age",
        sample["host_age"]
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

ReviewPage.propTypes = {
  metadata: PropTypes.object,
  samples: PropTypes.arrayOf(PropTypes.Sample),
};

export default ReviewPage;
