import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import moment from "moment";

import { openUrl } from "~utils/links";
import { Accordion } from "~/components/layout";
import PipelineVizStatusIcon from "~/components/views/PipelineViz/PipelineVizStatusIcon";

import cs from "./pipeline_step_details_mode.scss";

class PipelineStepDetailsMode extends React.Component {
  renderStatusBox() {
    const { status, startTime } = this.props;
    let statusTitle, statusDescription;
    switch (status) {
      case "inProgress":
        statusTitle = "Current step";
        statusDescription = `Running for ${moment(
          Math.floor(startTime * 1000)
        ).fromNow(true)}`;
        break;
      case "errored":
        statusTitle = "Sample failed at this step.";
        statusDescription =
          "Please upload again or reach out to help@idseq.com.";
        break;
      default:
        return;
    }

    return (
      <div className={cx(cs.statusBox, cs[status])}>
        <PipelineVizStatusIcon type={status} className={cs.statusIcon} />
        <div className={cs.statusText}>
          <div className={cs.statusTitle}>{statusTitle}</div>
          <div className={cs.statusDescription}>{statusDescription}</div>
        </div>
      </div>
    );
  }

  renderStepInfo() {
    const { description } = this.props;
    if (description) {
      const header = <div className={cs.title}>Step Info</div>;
      return (
        <Accordion header={header} className={cs.accordion} open={true}>
          <div className={cx(cs.description, cs.accordionContent)}>
            {description}
          </div>
        </Accordion>
      );
    }
  }

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
          >{`From ${inputFileGroup.fromStepName || "Sample"} Step:`}</div>
          {this.renderFileList(inputFileGroup.files)}
        </div>
      );
    });

    const fileGroupHeader = <div className={cs.title}>Input Files</div>;
    return (
      <Accordion className={cs.accordion} header={fileGroupHeader} open={true}>
        <div className={cs.accordionContent}>{fileGroupList}</div>
      </Accordion>
    );
  }

  renderOutputFiles() {
    const { stepName, outputFiles } = this.props;
    if (outputFiles && outputFiles.length) {
      const outputFilesHeader = <div className={cs.title}>Output Files</div>;
      return (
        <Accordion
          className={cs.accordion}
          header={outputFilesHeader}
          open={true}
        >
          <div className={cx(cs.accordionContent, cs.fileGroup)}>
            <div className={cs.fileGroupHeader}>{`From ${stepName} Step:`}</div>
            {this.renderFileList(outputFiles)}
          </div>
        </Accordion>
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
    const { stepName } = this.props;
    return (
      <div className={cs.content}>
        <div className={cs.stepName}>{stepName}</div>
        {this.renderStatusBox()}
        {this.renderStepInfo()}
        {this.renderInputFiles()}
        {this.renderOutputFiles()}
      </div>
    );
  }
}

const FileList = PropTypes.arrayOf(
  PropTypes.shape({
    fileName: PropTypes.string.isRequired,
    url: PropTypes.string,
  }).isRequired
);

PipelineStepDetailsMode.propTypes = {
  stepName: PropTypes.string,
  description: PropTypes.string,
  inputFiles: PropTypes.arrayOf(
    PropTypes.shape({
      fromStepName: PropTypes.string,
      files: FileList.isRequired,
    }).isRequired
  ).isRequired,
  outputFiles: FileList.isRequired,
  status: PropTypes.string,
  startTime: PropTypes.number,
};

export default PipelineStepDetailsMode;
