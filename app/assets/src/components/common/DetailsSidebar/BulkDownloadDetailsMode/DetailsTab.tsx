import { get } from "lodash/fp";
import React from "react";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { Accordion } from "~/components/layout";
import { BulkDownloadDetails, DownloadType } from "~/interface/shared";

import cs from "./bulk_download_details_mode.scss";

interface DetailsTabProps {
  bulkDownload: BulkDownloadDetails;
  downloadType: DownloadType;
}

const DetailsTab = ({ bulkDownload, downloadType }: DetailsTabProps) => {
  const fields = [];

  const allRuns = bulkDownload.pipeline_runs.concat(bulkDownload.workflow_runs);

  if (bulkDownload.num_samples) {
    fields.push({
      label: "Samples",
      value: bulkDownload.num_samples,
    });
  }

  if (downloadType.file_type_display) {
    fields.push({
      label: "File Format",
      value: downloadType.file_type_display,
    });
  }

  downloadType.fields &&
    downloadType.fields.forEach((field) => {
      const fieldValue = get(
        ["params", field.type, "displayName"],
        bulkDownload,
      );

      if (fieldValue) {
        fields.push({
          label: field.display_name,
          value: fieldValue,
        });
      }
    });

  return (
    <div className={cs.detailsTab}>
      <Accordion
        className={cs.accordion}
        header={<div className={cs.header}>Details</div>}
        bottomContentPadding
        open
      >
        {bulkDownload.description && (
          <div className={cs.description}>{bulkDownload.description}</div>
        )}
        <FieldList fields={fields} />
      </Accordion>
      {allRuns.length > 0 && (
        <Accordion
          className={cs.accordion}
          header={<div className={cs.header}>Samples in this Download</div>}
          bottomContentPadding
        >
          <div className={cs.samplesList}>
            {allRuns.map((run) => (
              <div
                key={`${run.id}+${run.sample_name}`}
                className={cs.sampleName}
              >
                {run.sample_name}
              </div>
            ))}
          </div>
        </Accordion>
      )}
    </div>
  );
};

export default DetailsTab;
