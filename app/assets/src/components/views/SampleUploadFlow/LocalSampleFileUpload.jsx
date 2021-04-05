import React from "react";
import _fp, {
  size,
  get,
  flow,
  groupBy,
  mapValues,
  sortBy,
  slice,
  sumBy,
  keyBy,
} from "lodash/fp";
import cx from "classnames";

import { sampleNameFromFileName } from "~utils/sample";
import FilePicker from "~ui/controls/FilePicker";
import PropTypes from "~/components/utils/propTypes";
import { logAnalyticsEvent } from "~/api/analytics";
import List from "~/components/ui/List";

import cs from "./sample_upload_flow.scss";

const map = _fp.map.convert({ cap: false });

class LocalSampleFileUpload extends React.Component {
  state = {
    showInfo: false,
  };

  onDrop = acceptedFiles => {
    // Group files by sample name.
    const sampleNamesToFiles = flow(
      groupBy(file => sampleNameFromFileName(file.name)),
      // Make sure R1 comes before R2 and there are at most 2 files.
      // Sort files by lower case file name, then take the first two.
      mapValues(
        flow(
          sortBy(file => file.name.toLowerCase()),
          slice(0, 2)
        )
      )
    )(acceptedFiles);

    // Create local samples.
    const localSamples = map(
      (files, name) => ({
        name,
        project_id: get("id", this.props.project),
        // Set by the user in the Upload Metadata step.
        host_genome_id: "",
        input_files_attributes: files.map(file => ({
          source_type: "local",
          source: file.name,
          parts: file.name,
          upload_client: "web",
        })),
        // Store the files keyed by name for easy de-duping. These files are associated with the input_file_attributes.
        files: keyBy("name", files),
        status: "created",
        client: "web",
      }),
      sampleNamesToFiles
    );

    this.props.onChange(localSamples);
  };

  onRejected = rejectedFiles => {
    const emptyFiles = rejectedFiles.filter(f => f.size === 0);
    const bigFiles = rejectedFiles.filter(f => f.size !== 0);
    const mapNames = _fp.compose(_fp.join(", "), _fp.map("name"));
    let msg = "Some of your files cannot be uploaded.\n";
    if (emptyFiles.length > 0) {
      msg += `- Empty files: ${mapNames(emptyFiles)}\n`;
    }
    if (bigFiles.length > 0) {
      msg += `- Too large: ${mapNames(
        bigFiles
      )}\nSize must be under 5GB for local uploads. For larger files, please try our CLI.`;
    }
    window.alert(msg);
  };

  toggleInfo = () => {
    this.setState(
      {
        showInfo: !this.state.showInfo,
      },
      () => {
        logAnalyticsEvent("LocalSampleFileUpload_more-info-toggle_clicked", {
          showInfo: this.state.showInfo,
        });
      }
    );
  };

  getFilePickerTitle = () => {
    const { hasSamplesLoaded } = this.props;

    const fileCount = sumBy(
      s => size(s.input_files_attributes),
      this.props.samples
    );

    if (fileCount) {
      return `${fileCount} File${fileCount > 1 ? "s" : ""} Selected For Upload`;
    }

    if (hasSamplesLoaded) {
      return "No Files Selected For Upload";
    }

    return null;
  };

  render() {
    const filePickerTitle = this.getFilePickerTitle();

    return (
      <div className={cs.localFileUpload}>
        <div className={cs.label}>
          Upload Your Input Files
          <span className={cs.infoLink} onClick={this.toggleInfo}>
            {this.state.showInfo ? "Hide" : "More"} Info
          </span>
        </div>
        {this.state.showInfo && (
          <div className={cs.info}>
            <div className={cs.title}>File Instructions</div>
            <List
              listItems={[
                `Accepted file formats: fastq (.fq), fastq.gz (.fq.gz), fasta
                (.fa), fasta.gz (.fa.gz).`,
                `Paired files must be labeled with "_R1" or
                "_R2" at the end of the basename.`,
                `File names must be no longer than 120 characters and can only
                contain letters from the English alphabet (A-Z, upper and lower
                case), numbers (0-9), periods (.), hyphens (-) and underscores
                (_). Spaces are not allowed.`,
              ]}
            />
          </div>
        )}
        <FilePicker
          className={cx(cs.localFilePicker, !filePickerTitle && cs.short)}
          title={filePickerTitle}
          onChange={this.onDrop}
          onRejected={this.onRejected}
          multiFile={true}
        />
      </div>
    );
  }
}

LocalSampleFileUpload.propTypes = {
  project: PropTypes.Project,
  onChange: PropTypes.func.isRequired,
  samples: PropTypes.arrayOf(PropTypes.object),
  hasSamplesLoaded: PropTypes.bool,
};

export default LocalSampleFileUpload;
