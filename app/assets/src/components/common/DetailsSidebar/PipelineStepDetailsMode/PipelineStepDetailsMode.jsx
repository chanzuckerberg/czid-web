import React from "react";
import { groupBy } from "lodash/fp";
import PropTypes from "prop-types";

import cs from "./pipeline_step_details_mode.scss";

class PipelineStepDetailsMode extends React.Component {
  renderInputFiles() {
    const { inputFiles } = this.props;
    if (!inputFiles || !inputFiles.length) {
      return null;
    }

    const fromStepNameToFile = groupBy("fromStepName", inputFiles);
    const fileGroupList = Object.keys(fromStepNameToFile).map(fromStepName => {
      const fileGroup = fromStepNameToFile[fromStepName];
      const fileList = fileGroup.map((file, i) => {
        return (
          <div className={cs.fileLink} key={`${file.fileName}-${i}`}>
            {file.fileName}
          </div>
        );
      });

      // TODO(ezhong): Figure out what to put as fileGroupHeader if input is
      // provided by a user (instead of step output)
      return (
        <div className={cs.fileGroup} key={fromStepName}>
          <div className={cs.fileGroupHeader}>{`From ${fromStepName}:`}</div>
          {fileList}
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
      const fileList = outputFiles.map((file, i) => {
        return (
          <div className={cs.fileLink} key={`${file.fileName}-${i}`}>
            {file.fileName}
          </div>
        );
      });
      return (
        <div className={cs.stepFilesListBox}>
          <div className={cs.stepFilesListBoxHeader}>Output Files</div>
          {fileList}
        </div>
      );
    }
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
      fileName: PropTypes.string,
    })
  ),
  outputFiles: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
    })
  ),
};

export default PipelineStepDetailsMode;
