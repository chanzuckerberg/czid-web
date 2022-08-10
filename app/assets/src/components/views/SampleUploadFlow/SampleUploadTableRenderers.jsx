import { get, isEmpty } from "lodash/fp";
import React from "react";
import { CellMeasurer, CellMeasurerCache } from "react-virtualized";
import { UserContext } from "~/components/common/UserContext";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import IconInfoSmall from "~/components/ui/icons/IconInfoSmall";
import { PRE_UPLOAD_CHECK_FEATURE } from "~/components/utils/features";
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
          {cellData.fileName.map(fileName => (
            <UserContext.Consumer key={fileName}>
              {currentUser => (
                <div key={fileName} className={cs.fileName}>
                  {fileName}
                  {currentUser.allowedFeatures.includes(
                    PRE_UPLOAD_CHECK_FEATURE,
                  ) &&
                    isEmpty(fileName) === false &&
                    cellData.isValid === false && (
                      <ColumnHeaderTooltip
                        trigger={
                          <span>
                            <IconInfoSmall className={cs.iconInfo} />
                          </span>
                        }
                        content={cellData.error}
                      />
                    )}
                </div>
              )}
            </UserContext.Consumer>
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
      error: get("error", rowData),
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
        <UserContext.Consumer>
          {currentUser => (
            <div>
              {!currentUser.allowedFeatures.includes(
                PRE_UPLOAD_CHECK_FEATURE,
              ) ? (
                <Checkbox
                  className={selectableCellClassName}
                  checked={selected.has(cellData.id)}
                  onChange={onSelectRow}
                  value={disabled ? -1 : cellData.id}
                  disabled={disabled}
                />
              ) : cellData.finishedValidating ? (
                <Checkbox
                  className={selectableCellClassName}
                  checked={selected.has(cellData.id)}
                  onChange={onSelectRow}
                  value={disabled ? -1 : cellData.id}
                  disabled={!selected.has(cellData.id)}
                />
              ) : (
                <i className="fa fa-spinner fa-pulse fa-fw" />
              )}
            </div>
          )}
        </UserContext.Consumer>
      </div>
    );
  };
}
SampleUploadTableRenderers.contextType = UserContext;
