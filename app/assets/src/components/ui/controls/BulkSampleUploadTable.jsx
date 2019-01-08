import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";
import cx from "classnames";
import { get } from "lodash/fp";
import cs from "./bulk_sample_upload_table.scss";

class BulkSampleUploadTable extends React.Component {
  render() {
    const { sampleNamesToFiles, fileNamesToProgress } = this.props;

    if (isEmpty(sampleNamesToFiles)) return null;

    let entries = [];
    for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
      console.log(fileNamesToProgress);
      console.log("name:", files[0].name);
      console.log(
        "must be here:",
        (fileNamesToProgress &&
          fileNamesToProgress["NGS-17087_S41_R1_001.fastq"]) ||
          -1
      );
      console.log(get(fileNamesToProgress, files[0].name));
      const filesCell = <span>{files.map(f => <div>{f.name}</div>)}</span>;
      console.log(
        "must be here too:",
        fileNamesToProgress && fileNamesToProgress[files[0].name]
      );
      const entry = {
        progress:
          (fileNamesToProgress && fileNamesToProgress[files[0].name]) || -1,
        sampleName: sampleName,
        files: filesCell,
        deleteButton: "X"
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
