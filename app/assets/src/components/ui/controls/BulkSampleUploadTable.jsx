import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";
import RemoveIcon from "../icons/RemoveIcon";
import LoadingIcon from "../icons/LoadingIcon";
import CheckmarkIcon from "../icons/CheckmarkIcon";

class BulkSampleUploadTable extends React.Component {
  render() {
    const { sampleNamesToFiles, fileNamesToProgress, onRemoved } = this.props;

    if (isEmpty(sampleNamesToFiles)) return null;

    // Put together the cell data for the DataTable
    let entries = [];
    for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
      let progress, removeIcon;
      if (isEmpty(fileNamesToProgress)) {
        removeIcon = (
          <RemoveIcon
            onClick={() => onRemoved(sampleName)}
            className="removeIcon"
          />
        );
      } else {
        // Show a checkmark when all a samples files are done
        progress = files.every(f => fileNamesToProgress[f.name] === 100) ? (
          <CheckmarkIcon />
        ) : (
          <LoadingIcon />
        );
      }

      const filesList = <div>{files.map(f => <div>{f.name}</div>)}</div>;

      const entry = {
        progress: progress,
        sampleName: sampleName,
        files: filesList,
        removeIcon: removeIcon
      };
      entries.push(entry);
    }

    return (
      <div className="bulk-sample-upload-table">
        <div className="detected-msg">
          These files were detected and matched. Remove files you do not want to
          upload:
        </div>
        <DataTable
          headers={{
            progress: "",
            sampleName: "Sample Name",
            files: "Files",
            removeIcon: ""
          }}
          columns={["progress", "sampleName", "files", "removeIcon"]}
          data={entries}
          striped={true}
        />
      </div>
    );
  }
}

BulkSampleUploadTable.propTypes = {
  // Ex: { "water_sample": [File, File], "csf_sample": [File, File] }
  sampleNamesToFiles: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  // Ex: { "water_file_r1": 24, "water_file_r2": 85 }
  fileNamesToProgress: PropTypes.objectOf(PropTypes.number),
  onRemoved: PropTypes.func
};

export default BulkSampleUploadTable;
