import React from "react";
import PropTypes from "~/components/utils/propTypes";
import { get } from "lodash/fp";

import { Accordion } from "~/components/layout";
import FieldList from "~/components/common/DetailsSidebar/FieldList";

import cs from "./bulk_download_details_mode.scss";

export default class DetailsTab extends React.Component {
  render() {
    const { bulkDownload, downloadType } = this.props;

    const fields = [
      {
        label: "Samples",
        value: bulkDownload.num_samples,
      },
    ];

    if (downloadType.file_type_display) {
      fields.push({
        label: "File Format",
        value: downloadType.file_type_display,
      });
    }

    downloadType.fields &&
      downloadType.fields.forEach(field => {
        const fieldValue = get(
          ["params", field.type, "displayName"],
          bulkDownload
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
          <FieldList fields={fields} />
        </Accordion>
        <Accordion
          className={cs.accordion}
          header={<div className={cs.header}>Samples in this Download</div>}
          bottomContentPadding
        >
          <div className={cs.samplesList}>
            {bulkDownload.pipeline_runs.map(pipelineRun => (
              <div key={pipelineRun.id} className={cs.sampleName}>
                {pipelineRun.sample_name}
              </div>
            ))}
          </div>
        </Accordion>
      </div>
    );
  }
}

DetailsTab.propTypes = {
  bulkDownload: PropTypes.BulkDownload,
  downloadType: PropTypes.DownloadType,
};
