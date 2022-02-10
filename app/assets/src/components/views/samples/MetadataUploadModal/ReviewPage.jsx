// TODO(mark): Add information about the sample input files and host genome into the table.
// TODO(mark): Add UI for upload progress and status.
import { cloneDeep, isUndefined } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { HOST_GENOME_SYNONYMS } from "~/components/common/Metadata/constants";
import { returnHipaaCompliantMetadata } from "~/components/utils/metadata";
import DataTable from "~/components/visualizations/table/DataTable";
import cs from "./metadata_upload_modal.scss";

const ReviewPage = ({ metadata, samples }) => {
  if (isUndefined(metadata) || isUndefined(samples)) return null;

  // Create a copy of metadata that hides hipaa sensitive data
  const metadataRows = cloneDeep(metadata.rows);
  const cleanMetadataRows = metadataRows.map(sample => {
    const hostGenomeName = HOST_GENOME_SYNONYMS.reduce(
      (match, hostGenome) => sample[hostGenome] || match,
      null,
    );
    const isHuman = hostGenomeName.toLowerCase() === "human";
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

ReviewPage.propTypes = {
  metadata: PropTypes.object,
  samples: PropTypes.arrayOf(PropTypes.Sample),
};

export default ReviewPage;
