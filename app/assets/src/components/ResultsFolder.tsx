import React from "react";
import {
  RESULTS_FOLDER_STAGE_KEYS,
  RESULTS_FOLDER_STEP_KEYS,
} from "~/components/utils/resultsFolder";
import Divider from "./layout/Divider";
import cs from "./results_folder.scss";
import { openUrl, downloadStringToFile } from "./utils/links";

interface OutputFileProps {
  file?: object;
}

class OutputFile extends React.Component<OutputFileProps> {
  file: $TSFixMe;
  constructor(props: OutputFileProps, context: $TSFixMe) {
    super(props, context);
    this.file = props.file;
  }

  conditionalOpenUrl = (url: $TSFixMe) => {
    if (url) {
      openUrl(this.file.url);
    }
  };

  render() {
    return (
      <tr
        className={`${this.file.url ? "" : "disabled-"}file-link`}
        onClick={this.conditionalOpenUrl.bind(this, this.file.url)}
      >
        <td className={cs.tableData}>
          <i className="fa fa-file" />
          {this.file["displayName"]}
          <span className="size-tag"> -- {this.file["size"]}</span>
        </td>
      </tr>
    );
  }
}

interface ConfigFileProps {
  stageDagJson?: object;
}

class ConfigFile extends React.Component<ConfigFileProps> {
  stageDagJson: $TSFixMe;
  constructor(props: ConfigFileProps, context: $TSFixMe) {
    super(props, context);
    this.stageDagJson = props.stageDagJson;
  }

  render() {
    return (
      <tr
        className="file-link"
        onClick={downloadStringToFile.bind(this, this.stageDagJson)}
      >
        <td className={cs.tableData}>
          <i className="fa fa-file" />
          config.json
        </td>
      </tr>
    );
  }
}

const ResultsFolderStepDivider = () => {
  return (
    <tr key="last">
      <td className={cs.tableData}>
        <Divider />
      </td>
    </tr>
  );
};

interface ResultsFolderStepProps {
  step?: object;
}

class ResultsFolderStep extends React.Component<ResultsFolderStepProps> {
  step: $TSFixMe;
  constructor(props: $TSFixMe, context: $TSFixMe) {
    super(props, context);
    this.step = props.step;
  }

  render() {
    const {
      stepDescriptionKey,
      readsAfterKey,
      filesKey,
      stepNameKey,
    } = RESULTS_FOLDER_STEP_KEYS;

    const description = this.step[stepDescriptionKey];
    const readsAfter = this.step[readsAfterKey];
    const fileList = this.step[filesKey];
    const stepName = this.step[stepNameKey];
    return (
      <tbody>
        <tr key="first">
          <td className={cs.tableData}>
            Step <b>{stepName}</b>: {description}{" "}
            {readsAfter ? (
              <span>
                (<b>{readsAfter}</b> reads remained.)
              </span>
            ) : null}
          </td>
        </tr>
        {fileList.map((file: $TSFixMe, j: $TSFixMe) => {
          return <OutputFile file={file} key={j} />;
        })}
        <ResultsFolderStepDivider />
      </tbody>
    );
  }
}

interface ResultsFolderStepListProps {
  stepDict?: object;
}

class ResultsFolderStepList extends React.Component<
  ResultsFolderStepListProps
> {
  stepDict: $TSFixMe;
  constructor(props: $TSFixMe, context: $TSFixMe) {
    super(props, context);
    this.stepDict = props.stepDict;
  }

  render() {
    return Object.keys(this.stepDict).map((stepKey, i) => {
      const step = this.stepDict[stepKey];
      return <ResultsFolderStep step={step} key={i} />;
    });
  }
}

interface ResultsFolderProps {
  filePath?: string;
  fileList?: unknown[];
  samplePath?: string;
  sampleName?: string;
  projectName?: string;
  rawResultsUrl?: string;
}

class ResultsFolder extends React.Component<ResultsFolderProps> {
  filePath: $TSFixMe;
  fileUrl: $TSFixMe;
  projectName: $TSFixMe;
  rawResultsUrl: $TSFixMe;
  sampleName: $TSFixMe;
  stageDict: $TSFixMe;
  constructor(props: $TSFixMe, context: $TSFixMe) {
    super(props, context);
    this.fileUrl = props.filePath;
    this.filePath = this.fileUrl.split("/");
    this.stageDict = props.fileList;
    this.sampleName = props.sampleName;
    this.projectName = props.projectName;
    this.rawResultsUrl = props.rawResultsUrl;
  }

  render() {
    const {
      stageDescriptionKey,
      // @ts-expect-error Property 'stageDagJsonKey' does not exist on type
      stageDagJsonKey,
      stepsKey,
      stageNameKey,
    } = RESULTS_FOLDER_STAGE_KEYS;
    return (
      <div className="results-folder">
        <div className="header">
          <span className="title">
            <a href="/">{this.filePath[0]}</a>
            <span className="path">{">"}</span>

            <a href={`/home?project_id=${this.filePath[1]}`}>
              {this.projectName}
            </a>
            <span className="path">/</span>

            <a href={this.props.samplePath}>{this.sampleName}</a>
            <span className="path">/</span>

            {this.filePath[3]}
          </span>
        </div>
        <div className="header">
          {!Object.keys(this.stageDict).length
            ? "No files to show"
            : Object.keys(this.stageDict).map((stageKey, k) => {
                const stage = this.stageDict[stageKey];
                const stageDescription = stage[stageDescriptionKey];
                const stageDagJson = stage[stageDagJsonKey] || "None";
                const stepDict = stage[stepsKey];
                const stageName = stage[stageNameKey];
                return (
                  <table key={k}>
                    <thead>
                      <tr>
                        <th className={cs.tableHeader}>
                          {stageName}: {stageDescription}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <ConfigFile stageDagJson={stageDagJson} />
                      <ResultsFolderStepDivider />
                    </tbody>
                    <ResultsFolderStepList stepDict={stepDict} />
                  </table>
                );
              })}
          {this.rawResultsUrl ? (
            <table key="rawResults">
              <thead>
                <tr>
                  <th className={cs.tableHeader}>
                    Need an output that&apos;s not listed here?
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className="file-link"
                  onClick={openUrl.bind(this, this.rawResultsUrl)}
                >
                  <td className={cs.tableData}>Go to raw results folder</td>
                </tr>
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    );
  }
}

export default ResultsFolder;
