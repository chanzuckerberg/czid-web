import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import LoadingIcon from "~/components/ui/icons/LoadingIcon";
import CheckmarkIcon from "~/components/ui/icons/CheckmarkIcon";
import BasicPopup from "~/components/BasicPopup";
import cs from "./bulk_sample_upload_table.scss";

// BulkSampleUploadTable is a table showing Sample Names and Files for local
// bulk upload interactions
class BulkSampleUploadTable extends React.Component {
  render() {
    const { sampleNamesToFiles, fileNamesToProgress, onRemoved } = this.props;

    if (isEmpty(sampleNamesToFiles)) return null;

    // Put together the cell data for the DataTable
    const started = !isEmpty(fileNamesToProgress);
    let entries = [];
    for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
      let progress, removeIcon;
      // Show the Remove icons if nothing has started yet
      if (!started) {
        removeIcon = (
          <RemoveIcon
            onClick={() => onRemoved(sampleName)}
            className="removeIcon"
          />
        );
      } else {
        // Get average % progress
        let sum = 0;
        files.map(f => (sum += fileNamesToProgress[f.name]));
        const avg = Math.round(sum / files.length);

        if (avg === 100) {
          // Show checkmark when done
          progress = <CheckmarkIcon />;
        } else {
          // Show a loading indicator with percent on hover
          // TODO: Convert to a progress circle that will fill up
          progress = (
            <BasicPopup
              trigger={
                <span>
                  {/* Popup wouldn't work on just the svg for some reason */}
                  <LoadingIcon />
                </span>
              }
              content={`${avg}%`}
              size="mini"
            />
          );
        }
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
      <div className={cs.bulkSampleUploadTable}>
        <div className={cs.detectedMsg}>
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
