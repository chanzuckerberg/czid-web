import cx from "classnames";
import _fp, {
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
import { TrackEventType, useTrackEvent } from "~/api/analytics";
import { useAllowedFeatures } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import List from "~/components/ui/List";
import { CONCAT_FILES_HELP_LINK } from "~/components/utils/documentationLinks";
import { Project, SampleFromApi } from "~/interface/shared";
import FilePicker from "~ui/controls/FilePicker";
import { sampleNameFromFileName } from "~utils/sample";
import { INPUT_FILE_TYPES, MAX_FILE_SIZE } from "../../../../constants";
import cs from "../../../../sample_upload_flow.scss";

// @ts-expect-error working with Lodash types
const map = _fp.map.convert({ cap: false });
const LABEL_ACCEPTED_FILE_FORMATS =
  "Accepted file formats: .fastq, .fastq.gz, .fq, .fq.gz";

interface LocalSampleFileUploadProps {
  project?: Project;
  onChange: $TSFixMeFunction;
  samples?: SampleFromApi[];
  hasSamplesLoaded?: boolean;
}

interface LocalSampleFileUploadWithContextProps
  extends LocalSampleFileUploadProps {
  allowedFeatures: string[];
  trackEvent: TrackEventType;
}

class LocalSampleFileUploadCC extends React.Component<LocalSampleFileUploadWithContextProps> {
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
          file_type: INPUT_FILE_TYPES.FASTQ,
        })),
        // Store the files keyed by name for easy de-duping. These files are associated with the input_files_attributes.
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
    const bigFiles = rejectedFiles.filter(f => f.size >= MAX_FILE_SIZE);
    const invalidFiles = rejectedFiles.filter(
      (f: $TSFixMe) => f.size > 0 && f.size < MAX_FILE_SIZE,
    );
    const mapNames = _fp.compose(_fp.join(", "), _fp.map("name"));
    let msg = "Some of your files cannot be uploaded.\n";
    if (emptyFiles.length > 0) {
      msg += `- Empty files: ${mapNames(emptyFiles)}\n`;
    }

    if (bigFiles.length > 0) {
      msg += `- Too large: ${mapNames(
        bigFiles,
      )}\nSize must be under 35 GB. Please try compressing and/or subsampling larger files before uploading, or use our CLI.`;
    }

    if (invalidFiles.length > 0) {
      msg += `- Files with invalid formats: ${mapNames(invalidFiles)}
      ${LABEL_ACCEPTED_FILE_FORMATS}`;
    }
    window.alert(msg);
  };

  toggleInfo = () => {
    this.setState({
      showInfo: !this.state.showInfo,
    });
  };

  getFilePickerTitle = () => {
    const { hasSamplesLoaded, samples } = this.props;

    const fileCount = sumBy(s => size(s.input_files_attributes), samples);

    if (fileCount) {
      if (
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        !samples.every(element => element.finishedValidating)
      ) {
        return `Validating ${
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          samples.filter(element => !element.finishedValidating).length
        } File${
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const finishedValidating = samples.every(
      element => element.finishedValidating,
    );
    const filePickerTitle = this.getFilePickerTitle();

    return (
      <div className={cs.localFileUpload}>
        <div className={cs.label}>
          Select Input Files
          <span className={cs.infoLink} onClick={this.toggleInfo}>
            {this.state.showInfo ? "Hide" : "More"} Info
          </span>
        </div>
        {this.state.showInfo && (
          <div className={cs.info}>
            <div className={cs.title}>File Instructions</div>
            <List
              listItems={[
                LABEL_ACCEPTED_FILE_FORMATS,
                `Paired files must be labeled with "_R1" or
                "_R2" at the end of the basename.`,
                <>
                  Multiple FASTQ files for a single metagenomic sample will be
                  automatically concatenated. To learn more about concatenation,{" "}
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
        {/* Specifying ".fastq, .fastq.gz" doesn't work, and could be a limitation of the MacOS file
        picker. Therefore, we rely on the backend `validate_sample_files` API to validate file names.
        For details, see https://bugs.chromium.org/p/chromium/issues/detail?id=521781 */}
        <FilePicker
          accept=".fastq, .fq, .gz"
          className={cx(cs.localFilePicker, !filePickerTitle && cs.short)}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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

// Using a function component wrapper provides a semi-hacky way to
// access useContext from multiple providers without the class component to function component
// conversion.
export const LocalSampleFileUpload = (props: LocalSampleFileUploadProps) => {
  const allowedFeatures = useAllowedFeatures();
  const trackEvent = useTrackEvent();

  return (
    <LocalSampleFileUploadCC
      {...props}
      allowedFeatures={allowedFeatures}
      trackEvent={trackEvent}
    />
  );
};
