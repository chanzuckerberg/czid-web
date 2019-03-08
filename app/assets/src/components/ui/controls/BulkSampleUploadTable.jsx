import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty, concat, size, sortBy } from "lodash/fp";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import LoadingIcon from "~/components/ui/icons/LoadingIcon";
import CheckmarkIcon from "~/components/ui/icons/CheckmarkIcon";
import BasicPopup from "~/components/BasicPopup";
import cs from "./bulk_sample_upload_table.scss";

// BulkSampleUploadTable is a table showing Sample Names and Files for local
// bulk upload interactions
class BulkSampleUploadTable extends React.Component {
  render() {
    const {
      sampleNamesToFiles,
      fileNamesToProgress,
      onRemoved,
      hideProgressColumn
    } = this.props;

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

      // Sort the file list by name.
      const sortedFiles = sortBy(file => file.name || file.source, files);

      const filesList = (
        <div>
          {sortedFiles.map(f => <div key={f.source}>{f.name || f.source}</div>)}
        </div>
      );

      const entry = {
        progress: progress,
        sampleName: sampleName,
        files: filesList,
        removeIcon: removeIcon
      };
      entries.push(entry);
    }

    const sortedEntries = sortBy("sampleName", entries);

    return (
      <div className={cs.bulkSampleUploadTable}>
        {this.props.showCount && (
          <div className={cs.detectedMsg}>
            <span className={cs.count}>
              {size(this.props.sampleNamesToFiles)} samples detected.&nbsp;
            </span>
            Remove samples you do not want to upload.
          </div>
        )}
        <DataTable
          headers={{
            progress: "",
            sampleName: "Sample Name",
            files: "Files",
            removeIcon: ""
          }}
          columns={concat(!hideProgressColumn ? ["progress"] : [], [
            "sampleName",
            "files",
            "removeIcon"
          ])}
          data={sortedEntries}
        />
      </div>
    );
  }
}

BulkSampleUploadTable.propTypes = {
  // Ex: { "water_sample": [File, File], "csf_sample": [File, File] }
  sampleNamesToFiles: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string
      })
    )
  ),
  // Ex: { "water_file_r1": 24, "water_file_r2": 85 }
  fileNamesToProgress: PropTypes.objectOf(PropTypes.number),
  onRemoved: PropTypes.func,
  hideProgressColumn: PropTypes.bool,
  showCount: PropTypes.bool
};

export default BulkSampleUploadTable;
