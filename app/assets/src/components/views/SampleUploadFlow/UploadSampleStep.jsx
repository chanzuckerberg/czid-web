// TODO(mark): Verify that sample name is not duplicate for local uploads at this step.
import React from "react";
import BulkUploadImport from "~/components/BulkUploadImport";
import PropTypes from "~/components/utils/propTypes";

class UploadSampleStep extends React.Component {
  render() {
    return (
      <BulkUploadImport
        projects={this.props.projects}
        csrf={this.props.csrf}
        host_genomes={this.props.host_genomes}
        admin={this.props.admin}
        onBulkUploadLocal={this.props.onUploadSamplesLocal}
        onBulkUploadRemote={this.props.onUploadSamplesRemote}
      />
    );
  }
}

UploadSampleStep.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.Project),
  csrf: PropTypes.string,
  host_genomes: PropTypes.arrayOf(PropTypes.HostGenome),
  admin: PropTypes.bool,
  onUploadSamplesLocal: PropTypes.func.isRequired,
  onUploadSamplesRemote: PropTypes.func.isRequired
};

export default UploadSampleStep;
