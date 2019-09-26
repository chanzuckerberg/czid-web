import React from "react";
import { compact } from "lodash/fp";

import Input from "~ui/controls/Input";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import PropTypes from "~/components/utils/propTypes";
import { bulkImportRemoteSamples } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import Notification from "~ui/notifications/Notification";

import {
  NO_TARGET_PROJECT_ERROR,
  NO_VALID_SAMPLES_FOUND_ERROR,
} from "./constants";
import cs from "./sample_upload_flow.scss";

class RemoteSampleFileUpload extends React.Component {
  state = {
    showInfo: false,
    remoteS3Path: "",
    lastPathChecked: "",
  };

  componentDidUpdate() {
    if (
      this.state.error === NO_TARGET_PROJECT_ERROR &&
      this.props.project !== null
    ) {
      this.setState({
        error: "",
      });
    }
  }

  toggleInfo = () => {
    this.setState(
      {
        showInfo: !this.state.showInfo,
      },
      () => {
        logAnalyticsEvent("RemoteSampleFileUpload_more-info-toggle_clicked", {
          showInfo: this.state.showInfo,
        });
      }
    );
  };

  handleRemotePathChange = remoteS3Path => {
    this.setState({
      remoteS3Path,
    });
  };

  handleConnect = async () => {
    if (!this.props.project) {
      this.setState({
        error: NO_TARGET_PROJECT_ERROR,
      });
      this.props.onNoProject();
      return;
    }

    this.setState({
      error: "",
      lastPathChecked: this.state.remoteS3Path,
    });

    try {
      let newSamples = await bulkImportRemoteSamples({
        projectId: this.props.project.id,
        hostGenomeId: "",
        bulkPath: this.state.remoteS3Path,
      });

      // Remove any nil files from input_file_attributes.
      // This happens when there is an R2 file without an R1 file.
      newSamples = newSamples.samples.map(sample => ({
        ...sample,
        input_files_attributes: compact(sample.input_files_attributes),
      }));

      this.props.onChange(newSamples);

      logAnalyticsEvent("RemoteSampleFileUpload_connect_succeeded", {
        projectId: this.props.project.id,
        bulkPath: this.state.remoteS3Path,
        newSamples: newSamples.length,
      });
    } catch (e) {
      if (e.status) {
        // Use error message provided by the backend if it exists
        this.setState({ error: e.status });
      } else {
        // Otherwise fallback to a generic error message
        this.setState({ error: NO_VALID_SAMPLES_FOUND_ERROR });
      }

      logAnalyticsEvent("RemoteSampleFileUpload_connect_failed", {
        projectId: this.props.project.id,
        bulkPath: this.state.remoteS3Path,
        error: e.status || e.message || e,
      });
    }
  };

  render() {
    return (
      <div className={cs.remoteFileUpload}>
        <div className={cs.label}>
          Path to S3 Bucket
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
              <li>
                File names must be no longer than 120 characters and can only
                contain letters from the English alphabet (A-Z, upper and lower
                case), numbers (0-9), periods (.), hyphens (-) and underscores
                (_). Spaces are not allowed.
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

        {this.state.error && (
          <Notification
            type="error"
            displayStyle="flat"
            className={cs.notification}
          >
            {this.state.error}
          </Notification>
        )}
      </div>
    );
  }
}

RemoteSampleFileUpload.propTypes = {
  project: PropTypes.Project,
  onChange: PropTypes.func.isRequired,
  onNoProject: PropTypes.func.isRequired,
  showNoProjectError: PropTypes.bool,
};

export default RemoteSampleFileUpload;
