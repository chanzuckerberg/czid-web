// TODO(mark): Add information about the sample input files and host genome into the table.
// TODO(mark): Add UI for upload progress and status.
import React from "react";
import PropTypes from "prop-types";
import DataTable from "~/components/visualizations/table/DataTable";
import cs from "./metadata_upload_modal.scss";

class ReviewPage extends React.Component {
  render() {
    return (
      <div className={cs.tableContainer}>
        <DataTable
          className={cs.metadataTable}
          columns={this.props.metadata.headers}
          data={this.props.metadata.rows}
          columnWidth={120}
        />
      </div>
    );
  }
}

ReviewPage.propTypes = {
  metadata: PropTypes.object
};

export default ReviewPage;
