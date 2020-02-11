import React from "react";
import cx from "classnames";
import moment from "moment";
import Linkify from "react-linkify";
import ReactMarkdown from "react-markdown";

import { sampleErrorInfo } from "~/components/utils/sample";
import { openUrl } from "~utils/links";
import { Accordion } from "~/components/layout";
import PipelineVizStatusIcon from "~/components/views/PipelineViz/PipelineVizStatusIcon";
import PropTypes from "~/components/utils/propTypes";
import { withAnalytics } from "~/api/analytics";

import cs from "./pipeline_step_details_mode.scss";

const NCOV_PUBLIC_SITE = true;

class PipelineStepDetailsMode extends React.Component {
  renderStatusBox() {
    const { status, startTime, endTime, sample, pipelineRun } = this.props;
    let statusTitle, statusDescription;
    switch (status) {
      case "inProgress":
        statusTitle = "Current step";
        statusDescription = `Running for ${moment(
          Math.floor(startTime * 1000) // Convert seconds to milliseconds
        ).fromNow(true)}`;
        break;
      case "userErrored":
      case "pipelineErrored": {
        const { message, linkText, link } = sampleErrorInfo(
          sample,
          pipelineRun
        );
        statusTitle = "Sample failed at this step.";
        statusDescription = (
          <span>
            {message} <a href={link}>{linkText}</a>
          </span>
        );
        break;
      }
      case "finished":
        statusTitle = "Step completed";
        statusDescription =
          endTime &&
          `Finished in ${moment(Math.floor(startTime * 1000)).from(
            endTime * 1000,
            true
          )}.`;
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
      const descriptionWithoutIndentation = description.replace(/( {4})/gi, "");
      return (
        <Accordion header={header} className={cs.accordion} open={true}>
          <div className={cx(cs.description, cs.accordionContent)}>
            <Linkify>
              <ReactMarkdown
                source={descriptionWithoutIndentation}
                className={cs.description}
              />
            </Linkify>
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
        <a
          onClick={withAnalytics(
            () => openUrl(file.url),
            "PipelineStepDetailsMode_file-link_clicked",
            { fileName: file.fileName, url: file.url }
          )}
        >
          {file.fileName}
        </a>
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

  renderResources() {
    const { resources } = this.props;
    if (resources && resources.length) {
      const resourcesHeader = <div className={cs.title}>Resources</div>;
      const resourceLinks = resources.map(linkInfo => {
        return (
          <span key={linkInfo.url}>
            <a
              href={linkInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={withAnalytics(
                () => {},
                "PipelineStepDetailsMode_resource-link_clicked",
                { linkName: linkInfo.name, linkUrl: linkInfo.url }
              )}
            >
              {linkInfo.name}
            </a>
          </span>
        );
      });

      return (
        <Accordion
          className={cs.accordion}
          header={resourcesHeader}
          open={true}
        >
          <div className={cx(cs.resourcesContainer, cs.accordionContent)}>
            {resourceLinks}
          </div>
        </Accordion>
      );
    }
  }

  render() {
    const { stepName } = this.props;
    return (
      <div className={cs.content}>
        <div className={cs.stepName}>{stepName}</div>
        {this.renderStatusBox()}
        {this.renderStepInfo()}
        {!NCOV_PUBLIC_SITE && this.renderInputFiles()}
        {!NCOV_PUBLIC_SITE && this.renderOutputFiles()}
        {this.renderResources()}
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
  endTime: PropTypes.number,
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      url: PropTypes.string,
    })
  ),
  sample: PropTypes.Sample,
  pipelineRun: PropTypes.PipelineRun,
};

export default PipelineStepDetailsMode;
