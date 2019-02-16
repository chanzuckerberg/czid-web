import React from "react";
import _fp, {
  size,
  get,
  flow,
  groupBy,
  mapValues,
  sortBy,
  slice
} from "lodash/fp";
import { sampleNameFromFileName, cleanFilePath } from "~utils/sample";
import FilePicker from "~ui/controls/FilePicker";
import PropTypes from "~/components/utils/propTypes";
import cs from "./sample_upload_flow.scss";

const map = _fp.map.convert({ cap: false });

class LocalSampleFileUpload extends React.Component {
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

    this.props.onChange(localSamples);
  };

  onRejected = rejectedFiles =>
    window.alert(
      `${rejectedFiles
        .map(f => f.name)
        .join(
          ", "
        )} cannot be uploaded. Size must be under 5GB for local uploads. For larger files, please try our CLI.`
    );

  render() {
    let filePickerTitle = "Upload Your Input Files:";
    const sampleLen = size(this.props.samples);
    if (sampleLen > 0) {
      filePickerTitle = `${sampleLen} Sample${
        sampleLen > 1 ? "s" : ""
      } To Upload`;
    }

    return (
      <FilePicker
        className={cs.localFilepicker}
        title={filePickerTitle}
        onChange={this.onDrop}
        onRejected={this.onRejected}
        multiFile={true}
      />
    );
  }
}

LocalSampleFileUpload.propTypes = {
  project: PropTypes.Project,
  onChange: PropTypes.func.isRequired,
  samples: PropTypes.arrayOf(PropTypes.object)
};

export default LocalSampleFileUpload;
