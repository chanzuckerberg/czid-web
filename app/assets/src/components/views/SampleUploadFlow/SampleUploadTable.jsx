// Lists samples that the user has selected for upload.
// Allows users to select and unselect samples, and remove unselected samples.

import { difference, size, isEmpty, map, some } from "lodash/fp";
import React from "react";
import { SortDirection } from "react-virtualized";

import { formatFileSize } from "~/components/utils/format";
import PropTypes from "~/components/utils/propTypes";
import { Table } from "~/components/visualizations/table";

import SampleUploadTableRenderers from "./SampleUploadTableRenderers";
import { SELECT_ID_KEY } from "./constants";
import cs from "./sample_upload_table.scss";

const NAME_COLUMN = {
  dataKey: "name",
  width: 500,
  label: "Sample Name",
  className: cs.cell,
  headerClassName: cs.header,
};

const BASESPACE_PROJECT_NAME_COLUMN = {
  dataKey: "basespace_project_name",
  flexGrow: 1,
  width: 400,
  label: "Basespace Project",
  className: cs.cell,
  headerClassName: cs.header,
};

const FILE_SIZE_COLUMN = {
  dataKey: "file_size",
  flexGrow: 1,
  width: 100,
  label: "File Size",
  className: cs.cell,
  headerClassName: cs.header,
  cellRenderer: ({ cellData }) => formatFileSize(cellData),
};

const FILE_TYPE_COLUMN = {
  dataKey: "file_type",
  flexGrow: 1,
  width: 200,
  label: "File Type",
  className: cs.cell,
  headerClassName: cs.header,
};

const FILE_NAMES_COLUMN = {
  dataKey: "file_names",
  flexGrow: 1,
  width: 100,
  label: "Files",
  className: cs.cell,
  headerClassName: cs.header,
  cellRenderer: SampleUploadTableRenderers.renderFileNames,
};

export default class SampleUploadTable extends React.Component {
  getColumns = () => {
    const { sampleUploadType } = this.props;
    if (sampleUploadType === "basespace") {
      return [
        NAME_COLUMN,
        BASESPACE_PROJECT_NAME_COLUMN,
        FILE_SIZE_COLUMN,
        FILE_TYPE_COLUMN,
      ];
    }

    if (sampleUploadType === "remote" || sampleUploadType === "local") {
      return [NAME_COLUMN, FILE_NAMES_COLUMN];
    }
  };

  removeUnselectedSamples = () => {
    const { samples, onSamplesRemove, selectedSampleIds } = this.props;
    const unselectedSampleIds = difference(
      map(SELECT_ID_KEY, samples),
      Array.from(selectedSampleIds)
    );

    onSamplesRemove(unselectedSampleIds);
  };

  onRowClick = ({ rowData }) => {
    const { onSampleSelect, selectedSampleIds } = this.props;
    const sampleSelectId = rowData._selectId;

    onSampleSelect(sampleSelectId, !selectedSampleIds.has(sampleSelectId));
  };

  hasPairedSample = () => {
    const { samples } = this.props;
    return some(sample => size(sample.file_names) > 1, samples);
  };

  render() {
    const {
      samples,
      onSampleSelect,
      onAllSamplesSelect,
      selectedSampleIds,
    } = this.props;

    if (isEmpty(samples)) return null;

    return (
      <div className={cs.sampleUploadTable}>
        <div className={cs.detectedMsg}>
          <span className={cs.count}>
            {size(selectedSampleIds)} of {size(samples)} samples selected.&nbsp;
          </span>
          Select samples that you want to upload. &nbsp;
          <span
            className={cs.removeLink}
            onClick={this.removeUnselectedSamples}
          >
            Click to remove unselected samples
          </span>
        </div>
        <Table
          className={cs.table}
          columns={this.getColumns()}
          data={samples}
          defaultRowHeight={this.hasPairedSample() ? 75 : 40}
          sortable
          selectableKey="_selectId"
          onSelectRow={onSampleSelect}
          onSelectAllRows={onAllSamplesSelect}
          selected={selectedSampleIds}
          onRowClick={this.onRowClick}
          defaultSortBy="name"
          defaultSortDirection={SortDirection.ASC}
        />
      </div>
    );
  }
}

SampleUploadTable.propTypes = {
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      file_size: PropTypes.number,
      file_type: PropTypes.string,
      file_names: PropTypes.arrayOf(PropTypes.string),
      basespace_project_name: PropTypes.string,
      _selectId: PropTypes.string,
    })
  ),
  selectedSampleIds: PropTypes.instanceOf(Set),
  onSamplesRemove: PropTypes.func.isRequired,
  onSampleSelect: PropTypes.func.isRequired,
  onAllSamplesSelect: PropTypes.func.isRequired,
  sampleUploadType: PropTypes.SampleUploadType.isRequired,
};
