import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty, get } from "lodash/fp";
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
      const progress = files.every(f => fileNamesToProgress[f.name] === 100) ? (
        <CheckmarkIcon />
      ) : (
        <LoadingIcon />
      );
      const removeIcon = (
        <RemoveIcon
          onClick={() => onRemoved(sampleName)}
          className="removeIcon"
        />
      );
      // If files haven't started yet, show the remove icons.
      const action = isEmpty(fileNamesToProgress) ? removeIcon : progress;

      const entry = {
        action: action,
        sampleName: sampleName,
        files: <div>{files.map(f => <div>{f.name}</div>)}</div>
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
            action: "",
            sampleName: "Sample Name",
            files: "Files"
          }}
          columns={["action", "sampleName", "files"]}
          data={entries}
          striped={true}
        />
      </div>
    );
  }
}

BulkSampleUploadTable.propTypes = {};

export default BulkSampleUploadTable;
