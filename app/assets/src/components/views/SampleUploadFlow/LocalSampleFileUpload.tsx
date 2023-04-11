import cx from "classnames";
import _fp, {
  compact,
  flow,
  get,
  groupBy,
  keyBy,
  mapValues,
  size,
  slice,
  sortBy,
  sumBy,
} from "lodash/fp";
import React from "react";
import { FileWithPreview } from "react-dropzone";
import { trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import List from "~/components/ui/List";
import { CONCAT_FILES_HELP_LINK } from "~/components/utils/documentationLinks";
import {
  ONT_V1_FEATURE,
  PRE_UPLOAD_CHECK_FEATURE,
} from "~/components/utils/features";
import { Project, SampleFromApi } from "~/interface/shared";
import FilePicker from "~ui/controls/FilePicker";
import { sampleNameFromFileName } from "~utils/sample";
import cs from "./sample_upload_flow.scss";

// @ts-expect-error working with Lodash types
const map = _fp.map.convert({ cap: false });

interface LocalSampleFileUploadProps {
  project?: Project;
  onChange: $TSFixMeFunction;
  samples?: SampleFromApi[];
  hasSamplesLoaded?: boolean;
}

class LocalSampleFileUpload extends React.Component<LocalSampleFileUploadProps> {
  state = {
    showInfo: false,
  };

  onDrop = (acceptedFiles: SampleFromApi[]) => {
    // Group files by sample name.
    const sampleNamesToFiles = flow(
      groupBy((file: SampleFromApi) => sampleNameFromFileName(file.name)),
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
      (files: SampleFromApi[], name: string) => ({
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

  onRejected = (rejectedFiles: FileWithPreview[]) => {
    const emptyFiles = rejectedFiles.filter((f: $TSFixMe) => f.size === 0);
    const invalidFiles = rejectedFiles.filter(
      (f: $TSFixMe) => f.size > 0 && f.size < 5e9,
    );
    const mapNames = _fp.compose(_fp.join(", "), _fp.map("name"));
    let msg = "Some of your files cannot be uploaded.\n";
    if (emptyFiles.length > 0) {
      msg += `- Empty files: ${mapNames(emptyFiles)}\n`;
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
    const { allowedFeatures } = this.context || {};
    const { hasSamplesLoaded, samples } = this.props;

    const fileCount = sumBy(s => size(s.input_files_attributes), samples);

    if (fileCount) {
      if (
        allowedFeatures.includes(PRE_UPLOAD_CHECK_FEATURE) &&
        !samples.every(element => element.finishedValidating)
      ) {
        return `Validating ${
          samples.filter(element => !element.finishedValidating).length
        } File${
          samples.filter(element => !element.finishedValidating).length > 1
            ? "s"
            : ""
        }`;
      } else {
        return `${fileCount} File${
          fileCount > 1 ? "s" : ""
        } Selected For Upload`;
      }
    }
    if (hasSamplesLoaded) {
      return "No Files Selected For Upload";
    }

    return null;
  };

  render() {
    const { samples } = this.props;
    const { allowedFeatures } = this.context || {};
    const finishedValidating = samples.every(
      element => element.finishedValidating,
    );
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
                    listItems={compact([
                      `Metagenomics Illumina: fastq (.fq), fastq.gz (.fq.gz), fasta (.fa), fasta.gz (.fa.gz).`,
                      allowedFeatures.includes(ONT_V1_FEATURE) &&
                        `Metagenomics Nanopore: fastq (.fq), fastq.gz (.fq.gz).`,
                      `Consensus Genome: fastq (.fq).`,
                    ])}
                  />
                </>,
                `Paired files must be labeled with "_R1" or
                "_R2" at the end of the basename.`,
                <>
                  Multiple lane FASTQ files (Illumina) for one sample will be
                  automatically concatenated. To learn how to concatenate
                  Nanopore FASTQ files before upload,{" "}
                  <ExternalLink href={CONCAT_FILES_HELP_LINK}>
                    click here
                  </ExternalLink>
                  .
                </>,
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
          finishedValidating={finishedValidating}
        />
      </div>
    );
  }
}

LocalSampleFileUpload.contextType = UserContext;

export default LocalSampleFileUpload;
