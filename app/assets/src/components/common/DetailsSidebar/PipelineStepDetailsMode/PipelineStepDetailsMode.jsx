import React from "react";
import PropTypes from "prop-types";

import { openUrl } from "~utils/links";
import cs from "./pipeline_step_details_mode.scss";

class PipelineStepDetailsMode extends React.Component {
  renderInputFiles() {
    const { inputFiles } = this.props;
    if (!inputFiles || !inputFiles.length) {
      return null;
    }

    const fileGroupList = inputFiles.map((inputFileGroup, i) => {
      return (
        <div className={cs.fileGroup} key={`inputFileGroup.fromStepName-${i}`}>
          <div
            className={cs.fileGroupHeader}
          >{`From ${inputFileGroup.fromStepName || "Sample"}:`}</div>
          {this.renderFileList(inputFileGroup.files)}
        </div>
      );
    });
    return (
      <div className={cs.stepFilesListBox}>
        <div className={cs.stepFilesListBoxHeader}>Input Files</div>
        {fileGroupList}
      </div>
    );
  }

  renderOutputFiles() {
    const { outputFiles } = this.props;
    if (outputFiles && outputFiles.length) {
      return (
        <div className={cs.stepFilesListBox}>
          <div className={cs.stepFilesListBoxHeader}>Output Files</div>
          {this.renderFileList(outputFiles)}
        </div>
      );
    }
  }

  renderFileList(fileList) {
    return fileList.map((file, i) => {
      const cssClass = file.url ? cs.fileLink : cs.disabledFileLink;
      const content = file.url ? (
        // Use onClick instead of href to remove url appearance when hovering.
        <a onClick={() => openUrl(file.url)}>{file.fileName}</a>
      ) : (
        file.fileName
      );

      return (
        <div className={cssClass} key={`${file.fileName}-${i}`}>
          {content}
        </div>
      );
    });
  }

  render() {
    const { stepName, description } = this.props;
    return (
      <div className={cs.content}>
        <div className={cs.stepName}>{stepName}</div>
        <div className={cs.description}>{description}</div>
        {this.renderInputFiles()}
        {this.renderOutputFiles()}
      </div>
    );
  }
}

PipelineStepDetailsMode.propTypes = {
  stepName: PropTypes.string,
  description: PropTypes.string,
  inputFiles: PropTypes.arrayOf(
    PropTypes.shape({
      fromStepName: PropTypes.string,
      files: PropTypes.arrayOf(
        PropTypes.shape({
          fileName: PropTypes.string.isRequired,
          url: PropTypes.string,
        })
      ).isRequired,
    }).isRequired
  ).isRequired,
  outputFiles: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      url: PropTypes.string,
    }).isRequired
  ).isRequired,
};

export default PipelineStepDetailsMode;
