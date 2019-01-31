import React from "react";
import BulkUploadImport from "~/components/BulkUploadImport";
import PropTypes from "~/components/utils/propTypes";
import { handleBulkUploadLocal, handleBulkUploadRemote } from "./utils";

class BulkUploadImportPage extends React.Component {
  render() {
    return (
      <div>
        <BulkUploadImport
          {...this.props}
          onBulkUploadRemote={handleBulkUploadRemote}
          onBulkUploadLocal={handleBulkUploadLocal}
        />
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
