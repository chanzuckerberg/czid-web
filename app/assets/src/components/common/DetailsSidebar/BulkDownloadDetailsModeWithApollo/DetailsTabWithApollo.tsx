import { useReactiveVar } from "@apollo/client";
import { Icon } from "@czi-sds/components";
import { get } from "lodash/fp";
import React, { useEffect, useRef, useState } from "react";
import { getBulkDownload } from "~/api/bulk_downloads";
import { selectedBulkDownloadVar } from "~/cache/initialCache";
import FieldList from "~/components/common/DetailsSidebar/FieldList";
import { Accordion } from "~/components/layout";
import cs from "./bulk_download_details_mode_with_apollo.scss";

export const DetailsTabWithApollo = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const bulkDownloadFromApollo = useReactiveVar(selectedBulkDownloadVar);

  const lastBulkDownloadId = useRef(null);

  const fetchBulkDownload = async (id: number) => {
    const { bulk_download, download_type } = await getBulkDownload(id);

    // Guard against possible race conditions.
    if (bulk_download?.id === id) {
      selectedBulkDownloadVar({
        bulkDownload: bulk_download,
        downloadType: download_type,
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bulkDownloadFromApollo.downloadType) {
      // if the user has already fetched the bulk download details and is navigation back to the details tab
      setIsLoading(false);
    } else if (
      bulkDownloadFromApollo.bulkDownload.id !== lastBulkDownloadId.current
    ) {
      // if it is the first mount of the component
      // or if the user has clicked on a different bulk download while sidebar is open
      lastBulkDownloadId.current = bulkDownloadFromApollo.bulkDownload.id;
      setIsLoading(true);
      fetchBulkDownload(bulkDownloadFromApollo.bulkDownload.id);
    }
  }, [bulkDownloadFromApollo]);

  if (isLoading) {
    return (
      <div className={cs.content}>
        <Icon
          className={cs.icon}
          sdsIcon="loading"
          sdsSize="l"
          sdsType="static"
        />
      </div>
    );
  }

  const {
    pipeline_runs: pipelineRuns,
    workflow_runs: workflowRuns,
    num_samples: numSamples,
    description,
  } = bulkDownloadFromApollo.bulkDownload;

  const allRuns = pipelineRuns?.concat(workflowRuns) || [];

  const { downloadType } = bulkDownloadFromApollo;

  const getFields = () => {
    const fields = [];

    numSamples && fields.push({ label: "Samples", value: numSamples });

    downloadType?.file_type_display &&
      fields.push({
        label: "File Format",
        value: downloadType.file_type_display,
      });

    downloadType?.fields &&
      downloadType.fields.forEach(field => {
        const fieldValue = get(
          ["params", field.type, "displayName"],
          bulkDownloadFromApollo.bulkDownload,
        );

        if (fieldValue) {
          fields.push({
            label: field.display_name,
            value: fieldValue,
          });
        }
      });
    return fields;
  };

  return (
    <div className={cs.detailsTab}>
      <Accordion
        className={cs.accordion}
        header={<div className={cs.header}>Details</div>}
        bottomContentPadding
        open
      >
        {description && <div className={cs.description}>{description}</div>}
        {downloadType && <FieldList fields={getFields()} />}
      </Accordion>
      {allRuns.length > 0 && (
        <Accordion
          className={cs.accordion}
          header={<div className={cs.header}>Samples in this Download</div>}
          bottomContentPadding
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
