import cx from "classnames";
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
import React from "react";

import { trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import List from "~/components/ui/List";
import { LOCAL_MULTIPART_UPLOADS_FEATURE } from "~/components/utils/features";
import PropTypes from "~/components/utils/propTypes";
import FilePicker from "~ui/controls/FilePicker";
import { sampleNameFromFileName } from "~utils/sample";

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
          slice(0, 2),
        ),
      ),
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
      sampleNamesToFiles,
    );

    this.props.onChange(localSamples);
  };

  onRejected = rejectedFiles => {
    const { allowedFeatures = [] } = this.context || {};
    const emptyFiles = rejectedFiles.filter(f => f.size === 0);
    const invalidFiles = rejectedFiles.filter(f => f.size > 0 && f.size < 5e9);
    const mapNames = _fp.compose(_fp.join(", "), _fp.map("name"));
    let msg = "Some of your files cannot be uploaded.\n";
    if (emptyFiles.length > 0) {
      msg += `- Empty files: ${mapNames(emptyFiles)}\n`;
    }
    if (!allowedFeatures.includes(LOCAL_MULTIPART_UPLOADS_FEATURE)) {
      const bigFiles = rejectedFiles.filter(f => f.size >= 5e9);
      if (bigFiles.length > 0) {
        msg += `- Too large: ${mapNames(
          bigFiles,
        )}\nSize must be under 5GB for local uploads. For larger files, please try our CLI.`;
      }
    }

    if (invalidFiles.length > 0) {
      msg += `- Files with invalid formats: ${mapNames(invalidFiles)}
      Accepted file formats include: fastq (.fq), fastq.gz (.fq.gz), fasta (.fa), fasta.gz (.fa.gz)`;
    }
    window.alert(msg);
  };

  toggleInfo = () => {
    this.setState(
      {
        showInfo: !this.state.showInfo,
      },
      () => {
        trackEvent("LocalSampleFileUpload_more-info-toggle_clicked", {
          showInfo: this.state.showInfo,
        });
      },
    );
  };

  getFilePickerTitle = () => {
    const { hasSamplesLoaded } = this.props;

    const fileCount = sumBy(
      s => size(s.input_files_attributes),
      this.props.samples,
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
                <>
                  Accepted file formats:
                  <List
                    listItems={[
                      `Metagenomics: fastq (.fq), fastq.gz (.fq.gz), fasta (.fa), fasta.gz (.fa.gz).`,
                      `SARS-CoV-2 Consensus Genome: fastq (.fq).`,
                    ]}
                  />
                </>,
                `Paired files must be labeled with "_R1" or
                "_R2" at the end of the basename. If we detect multiple lane files, we will concatenate them for you.`,
                `File names must be no longer than 120 characters and can only
                contain letters from the English alphabet (A-Z, upper and lower
                case), numbers (0-9), periods (.), hyphens (-) and underscores
                (_). Spaces are not allowed.`,
              ]}
            />
          </div>
        )}
        <FilePicker
          accept=".fastq, .fq, .fasta, .fa, .gz"
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

LocalSampleFileUpload.contextType = UserContext;

LocalSampleFileUpload.propTypes = {
  project: PropTypes.Project,
  onChange: PropTypes.func.isRequired,
  samples: PropTypes.arrayOf(PropTypes.object),
  hasSamplesLoaded: PropTypes.bool,
};

export default LocalSampleFileUpload;
