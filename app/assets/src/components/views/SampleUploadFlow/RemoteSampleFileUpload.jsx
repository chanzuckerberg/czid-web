import React from "react";
import { compact } from "lodash/fp";
import Input from "~ui/controls/Input";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import PropTypes from "~/components/utils/propTypes";
import { bulkImportRemoteSamples } from "~/api";
import cs from "./sample_upload_flow.scss";

class RemoteSampleFileUpload extends React.Component {
  state = {
    showInfo: false,
    remoteS3Path: "",
    lastPathChecked: ""
  };

  toggleInfo = () => {
    this.setState({
      showInfo: !this.state.showInfo
    });
  };

  handleRemotePathChange = remoteS3Path => {
    this.setState({
      remoteS3Path
    });
  };

  handleConnect = async () => {
    if (!this.props.project) {
      this.setState({
        error: "Please select a project."
      });
      return;
    }

    this.setState({
      error: "",
      lastPathChecked: this.state.remoteS3Path
    });

    try {
      let newSamples = await bulkImportRemoteSamples({
        projectId: this.props.project.id,
        hostGenomeId: "",
        bulkPath: this.state.remoteS3Path
      });

      // Remove any nil files from input_file_attributes.
      // This happens when there is an R2 file without an R1 file.
      newSamples = newSamples.samples.map(sample => ({
        ...sample,
        input_files_attributes: compact(sample.input_files_attributes)
      }));

      this.props.onChange(newSamples);
    } catch (e) {
      if (e.status.startsWith("No samples imported")) {
        this.setState({
          error: "No valid samples were found."
        });
      }
    }
  };

  render() {
    return (
      <div className={cs.remoteFileUpload}>
        <div className={cs.label}>
          <span className={cs.labelTitle}>Path to S3 Bucket</span>
          <span className={cs.infoLink} onClick={this.toggleInfo}>
            {this.state.showInfo ? "Hide" : "More"} Info
          </span>
        </div>
        {this.state.showInfo && (
          <div className={cs.info}>
            <div className={cs.title}>S3 Bucket Instructions</div>
            <ul>
              <li>
                Please ensure that IDseq has permissions to read/list your S3
                bucket. <span>Contact us</span> for help getting set up.
              </li>
              <li>
                Also convert links like
                &quot;https://s3-us-west-2.amazonaws.com/your_s3_bucket/rawdata/fastqs&quot;
                to the format &quot;s3://your_s3_bucket/rawdata/fastqs&quot;
              </li>
            </ul>
            <div className={cs.title}>File Instructions</div>
            <ul>
              <li>
                Accepted file formats: fastq (.fq), fastq.gz (.fq.gz), fasta
                (.fa), fasta.gz (.fa.gz).
              </li>
              <li>
                Paired files must be labeled with &quot;_R1&quot; or
                &quot;_R2&quot; at the end of the basename.
              </li>
            </ul>
          </div>
        )}
        <div className={cs.controls}>
          <Input
            fluid
            placeholder="Ex: s3://your_s3_bucket/rawdata/fastqs"
            className={cs.input}
            value={this.state.remoteS3Path}
            onChange={this.handleRemotePathChange}
          />
          <PrimaryButton
            className={cs.connectButton}
            rounded={false}
            text="Connect to Bucket"
            disabled={
              this.state.remoteS3Path === "" ||
              this.state.remoteS3Path === this.state.lastPathChecked
            }
            onClick={this.handleConnect}
          />
        </div>
        {this.state.error && <div className={cs.error}>{this.state.error}</div>}
      </div>
    );
  }
}

RemoteSampleFileUpload.propTypes = {
  project: PropTypes.Project,
  onChange: PropTypes.func.isRequired
};

export default RemoteSampleFileUpload;
