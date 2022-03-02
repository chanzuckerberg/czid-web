import React from "react";
import { CellMeasurer, CellMeasurerCache } from "react-virtualized";

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
          {cellData.map(fileName => (
            <div key={fileName} className={cs.fileName}>
              {fileName}
            </div>
          ))}
        </div>
      </CellMeasurer>
    );
  };
}
