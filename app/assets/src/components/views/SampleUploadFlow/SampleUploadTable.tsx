// Lists samples that the user has selected for upload.
// Allows users to select and unselect samples, and remove unselected samples.

import { cx } from "@emotion/css";
import { difference, flatten, isEmpty, map, size, get } from "lodash/fp";
import React from "react";
import { SortDirection, defaultTableRowRenderer } from "react-virtualized";

import { UserContext } from "~/components/common/UserContext";
import { PRE_UPLOAD_CHECK_FEATURE } from "~/components/utils/features";
import { formatFileSize } from "~/components/utils/format";
import { Table } from "~/components/visualizations/table";

import { SampleUploadType } from "~/interface/shared";
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
  cellRenderer: ({ cellData }: { cellData: number }) =>
    formatFileSize(cellData),
};

const FILE_TYPE_COLUMN = {
  dataKey: "file_type",
  flexGrow: 1,
  width: 200,
  label: "File Type",
  className: cs.cell,
  headerClassName: cs.header,
};

const FILE_NAMES_R1_COLUMN = {
  dataKey: "file_names_R1",
  flexGrow: 1,
  width: NAME_COLUMN.width,
  label: "Files",
  className: cs.cell,
  headerClassName: cs.header,
  cellDataGetter: ({ dataKey, rowData }) =>
    SampleUploadTableRenderers.getCellData({ dataKey, rowData }),
  cellRenderer: SampleUploadTableRenderers.renderFileNames,
};

const FILE_NAMES_R2_COLUMN = {
  ...FILE_NAMES_R1_COLUMN,
  dataKey: "file_names_R2",
  label: "", // R2 column doesn't have a label
  disableSort: true, // Hide R2 sorting since sorting on R1 == sorting on R2
};

interface SampleUploadTableProps {
  samples?: {
    name?: string;
    file_size?: number;
    file_type?: string;
    file_names_R1?: string[];
    file_names_R2?: string[];
    basespace_project_name?: string;
    _selectId?: string;
  }[];
  selectedSampleIds?: Set<string>;
  onSamplesRemove: $TSFixMeFunction;
  onSampleSelect: (value: string, checked: boolean) => void;
  onAllSamplesSelect: $TSFixMeFunction;
  sampleUploadType: SampleUploadType;
  files?: unknown[];
}

export default class SampleUploadTable extends React.Component<
  SampleUploadTableProps
> {
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
      return [NAME_COLUMN, FILE_NAMES_R1_COLUMN, FILE_NAMES_R2_COLUMN];
    }
  };

  removeUnselectedSamples = () => {
    const { samples, onSamplesRemove, selectedSampleIds } = this.props;
    const unselectedSampleIds = difference(
      flatten(map(sample => sample[SELECT_ID_KEY].split(","), samples)),
      Array.from(selectedSampleIds),
    );

    onSamplesRemove(unselectedSampleIds);
  };

  onRowClick = ({ rowData }: $TSFixMe) => {
    const { onSampleSelect, selectedSampleIds } = this.props;
    // Support rows that contain multiple selection IDs
    const sampleSelectIds = rowData[SELECT_ID_KEY].split(",");
    sampleSelectIds.forEach((sampleSelectId: string) => {
      onSampleSelect(sampleSelectId, !selectedSampleIds.has(sampleSelectId));
    });
  };

  rowRenderer = (rowProps: $TSFixMe) => {
    const { sampleUploadType } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const data = rowProps.rowData;
    if (
      allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) &&
      sampleUploadType === "local"
    ) {
      // If any file is still being validated, disable the entire sample row.
      const finishedValidating = Object.values(data.finishedValidating).every(
        fileFinished => fileFinished,
      );
      // If at least one file is valid, enable the sample row.
      const isValid = Object.values(data.isValid).some(fileValid => fileValid);

      if (!finishedValidating || !isValid) {
        rowProps.className = cx(rowProps.className, cs.disabled);
      }
    }

    return defaultTableRowRenderer(rowProps);
  };

  render() {
    const mapSampleToConcatGroup = {};
    const selectedSampleIdsConcat = new Set();
    const {
      samples,
      onSampleSelect,
      onAllSamplesSelect,
      sampleUploadType,
      selectedSampleIds,
    } = this.props;

    const localUpload = sampleUploadType === "local";

    if (isEmpty(samples)) return null;

    // Map each sampleId (e.g. "1") to its concatenation group (e.g. "1,2")
    samples.forEach(sample =>
      sample._selectId.split(",").forEach(selectId => {
        mapSampleToConcatGroup[selectId] = sample._selectId;
      }),
    );
    // Convert selected sample IDs (e.g. ["1", "2"]) to the concatenated equivalent (["1,2"])
    selectedSampleIds.forEach(sampleId => {
      selectedSampleIdsConcat.add(mapSampleToConcatGroup[sampleId]);
    });

    return (
      <div className={cs.sampleUploadTable}>
        <div className={cs.detectedMsg}>
          <span className={cs.count}>
            {size(selectedSampleIdsConcat)} of {size(samples)} samples
            selected.&nbsp;
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
          // Default to 40px for non-local (i.e. BaseSpace) uploads
          defaultRowHeight={({ row }) =>
            10 + 30 * (row.file_names_R1?.length || 1)
          }
          headerLabelClassName={cs.columnHeaderLabel}
          // Reset cached row heights so dynamic heights keep working
          onColumnSort={() => SampleUploadTableRenderers.cache.clearAll()}
          sortable
          selectableKey={SELECT_ID_KEY}
          // Support selecting rows containing concatenated samples
          onSelectRow={(values: string, checked: boolean) =>
            values.split(",").forEach(value => onSampleSelect(value, checked))
          }
          onSelectAllRows={onAllSamplesSelect}
          selected={selectedSampleIdsConcat}
          selectableCellRenderer={
            localUpload ? SampleUploadTableRenderers.renderSelectableCell : null
          }
          onRowClick={this.onRowClick}
          defaultSortBy="name"
          defaultSortDirection={SortDirection.ASC}
          selectRowDataGetter={({ rowData }) => {
            if (localUpload) {
              return {
                finishedValidating: get("finishedValidating", rowData),
                id: get("_selectId", rowData),
                isValid: get("isValid", rowData),
              };
            }
            return get("_selectId", rowData);
          }}
          rowRenderer={this.rowRenderer}
        />
      </div>
    );
  }
}

SampleUploadTable.contextType = UserContext;
