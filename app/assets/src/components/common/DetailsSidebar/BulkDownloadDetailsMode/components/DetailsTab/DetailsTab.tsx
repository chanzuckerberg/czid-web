import React from "react";
import cs from "~/components/common/DetailsSidebar/BulkDownloadDetailsMode/bulk_download_details_mode.scss";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { Accordion } from "~/components/layout";
import { BulkDownloadDetails, DownloadType } from "~/interface/shared";

interface DetailsTabProps {
  bulkDownload?: BulkDownloadDetails;
  downloadType?: DownloadType;
}

export const DetailsTab = ({ bulkDownload, downloadType }: DetailsTabProps) => {
  const fields: { label: string; value: number | string }[] = [];

  const allRuns = bulkDownload?.pipeline_runs.concat(
    bulkDownload?.workflow_runs,
  );

  if (bulkDownload?.num_samples) {
    fields.push({
      label: "Samples",
      value: bulkDownload?.num_samples,
    });
  }

  if (downloadType?.file_type_display) {
    fields.push({
      label: "File Format",
      value: downloadType.file_type_display,
    });
  }

  downloadType?.fields &&
    downloadType.fields.forEach(field => {
      const paramsField = bulkDownload?.params[field.type];

      // fieldValue must be a string. In some cases, the field has a displayName, such as for filter values.
      // In other cases, the field just has a value, such as the download format. The stringify is here just
      // in case the value is not a string - for example the list of filters.
      const fieldValue =
        paramsField?.displayName ?? typeof paramsField?.value === "string" // if there's a displayName, use it
          ? (paramsField.value as string) // if value is a string, use it
          : JSON.stringify(paramsField?.value); // something is probably wrong if we're here, but stringify so the page doesn't crash

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
        data-testid="bulk-download-details"
      >
        {bulkDownload?.description && (
          <div className={cs.description}>{bulkDownload.description}</div>
        )}
        <FieldList fields={fields} />
      </Accordion>
      {allRuns && allRuns.length > 0 && (
        <Accordion
          className={cs.accordion}
          header={<div className={cs.header}>Samples in this Download</div>}
          bottomContentPadding
          data-testid="bulk-download-runs"
        >
          <div className={cs.samplesList}>
            {allRuns.map(run => (
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
