import React from "react";
import BulkUploadImport from "~/components/BulkUploadImport";
import PropTypes from "~/components/utils/propTypes";
import { bulkUploadLocal, bulkUploadRemote } from "~/api/upload";

class BulkUploadImportPage extends React.Component {
  render() {
    return (
      <div id="samplesUploader" className="row">
        <div className="col s6 offset-s3 upload-form-container">
          <BulkUploadImport
            {...this.props}
            onBulkUploadRemote={bulkUploadRemote}
            onBulkUploadLocal={bulkUploadLocal}
          />
        </div>
      </div>
    );
  }
}

BulkUploadImportPage.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.Project),
  csrf: PropTypes.string,
  host_genomes: PropTypes.arrayOf(PropTypes.HostGenome),
  admin: PropTypes.bool
};

export default BulkUploadImportPage;
