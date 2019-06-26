import React from "react";
import { flow, sortBy, size, isEmpty, map } from "lodash/fp";

import DataTable from "~/components/visualizations/table/DataTable";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import PropTypes from "~/components/utils/propTypes";
import { formatFileSize } from "~/components/utils/format";
import { withAnalytics } from "~/api/analytics";
import cs from "./basespace_sample_upload_table.scss";

const TABLE_COLUMN_WIDTHS = {
  name: 500,
  basespace_project_name: 400,
  file_size: 100,
  remove_icon: 20,
};

export default class BasespaceSampleUploadTable extends React.Component {
  render() {
    const { samples, onSampleRemove } = this.props;

    if (isEmpty(samples)) return null;

    const data = flow(
      map(sample => ({
        ...sample,
        file_size: formatFileSize(sample.file_size),
        remove_icon: (
          <RemoveIcon
            onClick={withAnalytics(
              () => onSampleRemove(sample.name),
              "BasepaceSampleUploadTable_remove-sample-btn_clicked",
              {
                numSample: samples.length,
              }
            )}
            className={cs.removeIcon}
          />
        ),
      })),
      sortBy("name")
    )(samples);

    return (
      <div className={cs.basespaceSampleUploadTable}>
        <div className={cs.detectedMsg}>
          <span className={cs.count}>
            {size(samples)} samples detected.&nbsp;
          </span>
          Remove samples you do not want to upload.
        </div>
        <DataTable
          headers={{
            name: "Sample Name",
            basespace_project_name: "Basespace Project",
            file_type: "File Type",
            file_size: "File Size",
          }}
          columns={[
            "name",
            "basespace_project_name",
            "file_size",
            "file_type",
            "remove_icon",
          ]}
          data={data}
          getColumnWidth={column => TABLE_COLUMN_WIDTHS[column] || ""}
          className={cs.table}
        />
      </div>
    );
  }
}

BasespaceSampleUploadTable.propTypes = {
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      file_size: PropTypes.number,
      file_type: PropTypes.string,
    })
  ),
  onSampleRemove: PropTypes.func.isRequired,
};
