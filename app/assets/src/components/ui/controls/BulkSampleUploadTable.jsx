import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";
import cx from "classnames";
import cs from "./bulk_sample_upload_table.scss";

class BulkSampleUploadTable extends React.Component {
  render() {
    const { sampleNamesToFiles } = this.props;

    if (isEmpty(sampleNamesToFiles)) return null;

    let entries = [];
    for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
      const filesCell = <span>{files.map(f => <div>{f.name}</div>)}</span>;
      const entry = {
        sampleName: sampleName,
        files: filesCell,
        deleteButton: "X",
        progress: 0
      };
      entries.push(entry);
    }

    return (
      <div className={cs.samplesWithFilesTable}>
        <div className={cs.detectedMsg}>
          These files were detected and matched. Remove files you do not want to
          upload:
        </div>
        <DataTable
          headers={{
            progress: "",
            sampleName: "Sample Name",
            files: "Files",
            deleteButton: ""
          }}
          columns={["progress", "sampleName", "files", "deleteButton"]}
          data={entries}
        />
      </div>
    );
  }
}

BulkSampleUploadTable.propTypes = {};

export default BulkSampleUploadTable;
