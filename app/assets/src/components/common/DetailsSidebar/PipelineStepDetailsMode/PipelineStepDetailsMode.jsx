import React from "react";
import PropTypes from "prop-types";

import cs from "./pipeline_step_details_mode.scss";

class PipelineStepDetailsMode extends React.Component {
  renderInputFiles() {
    const { inputFiles } = this.props;
    if (inputFiles && inputFiles.length) {
      const fromStepNameToFile = {};
      inputFiles.forEach(file => {
        if (!(file.fromStepName in fromStepNameToFile)) {
          fromStepNameToFile[file.fromStepName] = [];
        }
        fromStepNameToFile[file.fromStepName].push(file);
      });

      const fileGroupList = Object.keys(fromStepNameToFile).map(
        fromStepName => {
          const fileGroup = fromStepNameToFile[fromStepName];
          const fileList = fileGroup.map((file, i) => {
            return (
              <div className={cs.link} key={file.fileName + i.toString()}>
                {file.fileName}
              </div>
            );
          });

          // TODO(ezhong): Figure out what to put as fileGroupHeader if input is
          // provided by a user (instead of step output)
          return (
            <div className={cs.inputFileGroup} key={fromStepName}>
              <div
                className={cs.fileGroupHeader}
              >{`From ${fromStepName}:`}</div>
              {fileList}
            </div>
          );
        }
      );
      return (
        <div className={cs.block}>
          <div className={cs.subtitle}>Input Files</div>
          {fileGroupList}
        </div>
      );
    }
  }

  renderOutputFiles() {
    const { outputFiles } = this.props;
    if (outputFiles && outputFiles.length) {
      const fileList = outputFiles.map((file, i) => {
        return (
          <div className={cs.link} key={file.fileName + i.toString()}>
            {file.fileName}
          </div>
        );
      });
      return (
        <div className={cs.block}>
          <div className={cs.subtitle}>Output Files</div>
          {fileList}
        </div>
      );
    }
  }

  render() {
    const { stepName, description } = this.props;
    return (
      <div className={cs.content}>
        <div className={cs.title}>{stepName}</div>
        <div className={cs.text}>{description}</div>
        {this.renderInputFiles()}
        {this.renderOutputFiles()}
      </div>
    );
  }
}

PipelineStepDetailsMode.propTypes = {
  stepName: PropTypes.string,
  description: PropTypes.string,
  inputFiles: PropTypes.array,
  outputFiles: PropTypes.arrayOf(PropTypes.object),
};

export default PipelineStepDetailsMode;
