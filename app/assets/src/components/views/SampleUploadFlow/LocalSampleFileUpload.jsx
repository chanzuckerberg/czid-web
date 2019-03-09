import React from "react";
import _fp, {
  size,
  get,
  flow,
  groupBy,
  mapValues,
  sortBy,
  slice,
  sumBy
} from "lodash/fp";
import { sampleNameFromFileName, cleanFilePath } from "~utils/sample";
import FilePicker from "~ui/controls/FilePicker";
import PropTypes from "~/components/utils/propTypes";
import cs from "./sample_upload_flow.scss";
import cx from "classnames";

const map = _fp.map.convert({ cap: false });

class LocalSampleFileUpload extends React.Component {
  state = {
    showInfo: false
  };

  onDrop = acceptedFiles => {
    // Group files by sample name.
    const sampleNamesToFiles = flow(
      groupBy(file => sampleNameFromFileName(file.name)),
      // Make sure R1 comes before R2 and there are at most 2 files.
      // Sort files by lower case file name, then take the first two.
      mapValues(flow(sortBy(file => file.name.toLowerCase()), slice(0, 2)))
    )(acceptedFiles);

    // Create local samples.
    const localSamples = map(
      (files, name) => ({
        name,
        project_id: get("id", this.props.project),
        host_genome_id: "", // Supplied by metadata in next step.
        input_files_attributes: files.map(file => ({
          source_type: "local",
          source: cleanFilePath(file.name),
          parts: cleanFilePath(file.name)
        })),
        status: "created",
        client: "web"
      }),
      sampleNamesToFiles
    );

    this.props.onChange(localSamples, sampleNamesToFiles);
  };

  onRejected = rejectedFiles =>
    window.alert(
      `${rejectedFiles
        .map(f => f.name)
        .join(
          ", "
        )} cannot be uploaded. Size must be under 5GB for local uploads. For larger files, please try our CLI.`
    );

  toggleInfo = () => {
    this.setState({
      showInfo: !this.state.showInfo
    });
  };

  render() {
    const fileCount = sumBy(
      s => size(s.input_files_attributes),
      this.props.samples
    );
    const filePickerTitle = fileCount
      ? `${fileCount} File${fileCount > 1 ? "s" : ""} To Upload`
      : null;

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
  samples: PropTypes.arrayOf(PropTypes.object)
};

export default LocalSampleFileUpload;
