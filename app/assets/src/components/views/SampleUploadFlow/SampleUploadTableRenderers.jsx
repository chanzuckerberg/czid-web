import { get } from "lodash/fp";
import React from "react";
import { CellMeasurer, CellMeasurerCache } from "react-virtualized";
import { IconLoading } from "~/components/ui/icons";
import Checkbox from "~ui/controls/Checkbox";
import cs from "./sample_upload_table_renderers.scss";

export default class SampleUploadTableRenderers extends React.Component {
  // We need a <CellMeasurer> whose cache we reset to support dynamic row heights.
  // We clear this cache when the table is sorted, otherwise the text in the rows overlaps.
  // Details: <https://stackoverflow.com/a/45376881>.
  static cache = new CellMeasurerCache({
    fixedWidth: true,
  });

  static renderFileNames = ({ cellData, dataKey, parent, rowIndex }) => {
    return (
      <CellMeasurer
        cache={this.cache}
        key={dataKey}
        parent={parent}
        rowIndex={rowIndex}
      >
        <div>
          {[cellData].map(fileName => (
            <div key={fileName.fileName} className={cs.fileName.fileName}>
              {fileName.fileName}
            </div>
          ))}
        </div>
      </CellMeasurer>
    );
  };
  static getCellData = ({ dataKey, rowData }) => {
    const arr = {
      fileName: get(dataKey, rowData),
      finishedValidating: get("finishedValidating", rowData),
      id: get("_selectId", rowData),
      isValid: get("isValid", rowData),
    };
    return arr;
  };

  static renderSelectableCell = ({
    cellData,
    selected,
    onSelectRow,
    selectableCellClassName,
    disabled,
  }) => {
    return (
      <div>
        {cellData.finishedValidating ? (
          <Checkbox
            className={selectableCellClassName}
            checked={selected.has(cellData.id)}
            onChange={onSelectRow}
            value={disabled ? -1 : cellData.id}
            disabled={disabled}
          />
        ) : (
          <IconLoading className={cs.loadingIcon} />
        )}
      </div>
    );
  };
}
