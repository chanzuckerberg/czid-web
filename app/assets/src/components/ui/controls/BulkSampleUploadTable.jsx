import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";
import cx from "classnames";
import cs from "./bulk_sample_upload_table.scss";

class BulkSampleUploadTable extends React.Component {
  render() {
    const { sampleNamesToFiles } = this.props;

    if (isEmpty(sampleNamesToFiles)) return null;

    let rows = [];
    for (const [sampleName, files] of Object.entries(sampleNamesToFiles)) {
      const entry = (
        <tr>
          <td className={`data-table__data column-name`}>{sampleName}</td>
          <td className={`data-table__data column-files`}>
            {files.map(f => <div>{f.name}</div>)}
          </td>
        </tr>
      );
      rows.push(entry);
    }

    return (
      <table className="idseq-ui data-table">
        <thead>
          <tr>
            <th>Sample Name</th>
            <th>Files</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

BulkSampleUploadTable.propTypes = {};

export default BulkSampleUploadTable;
