import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";
// import cs from "./bulk_sample_upload_table.scss";

class BulkSampleUploadTable extends React.Component {
  render() {
    const { sampleNamesToFiles, fileNamesToProgress } = this.props;

    if (isEmpty(sampleNamesToFiles)) return null;

    // Put together the cell data for the DataTable
    let entries = [];
    for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
      let progress;
      if (!isEmpty(fileNamesToProgress)) {
        // Take the average % progress for the files.
        let sum = 0;
        files.map(f => (sum += fileNamesToProgress[f.name]));
        progress = Math.round(sum / files.length);
      }

      const entry = {
        progress: progress,
        sampleName: sampleName,
        files: <div>{files.map(f => <div>{f.name}</div>)}</div>,
        deleteButton: "X"
      };
      entries.push(entry);
    }

    return (
      <div className="samples-with-files-table">
        <div className="detected-msg">
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
