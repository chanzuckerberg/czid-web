import React from "react";
import Divider from "./layout/Divider";
import { openUrl, downloadStringToFile } from "./utils/links";

class OutputFile extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.file = props.file;
  }

  render() {
    return (
      <tr
        className={`${this.file.url ? "" : "disabled-"}file-link`}
        onClick={openUrl.bind(this, this.file.url)}
      >
        <td>
          <i className="fa fa-file" />
          {this.file["display_name"]}
          <span className="size-tag"> -- {this.file["size"]}</span>
        </td>
      </tr>
    );
  }
}

class ConfigFile extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.stageDagJson = props.stageDagJson;
  }

  render() {
    return (
      <tr
        className="file-link"
        onClick={downloadStringToFile.bind(this, this.stageDagJson)}
      >
        <td>
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
      <td>
        <Divider />
      </td>
    </tr>
  );
};

class ResultsFolderStep extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.stepName = props.stepName;
    this.step = props.step;
  }

  render() {
    let description = this.step["step_description"];
    let readsAfter = this.step["reads_after"];
    let fileList = this.step["file_list"];
    return (
      <tbody>
        <tr key="first">
          <td>
            Step <b>{this.stepName}</b>: {description}{" "}
            {readsAfter ? (
              <span>
                (<b>{readsAfter}</b> reads remained.)
              </span>
            ) : null}
          </td>
        </tr>
        {fileList.map((file, j) => {
          return <OutputFile file={file} key={j} />;
        })}
        <ResultsFolderStepDivider />
      </tbody>
    );
  }
}

class ResultsFolderStepList extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.stepDict = props.stepDict;
  }

  render() {
    return Object.keys(this.stepDict).map((stepName, i) => {
      let step = this.stepDict[stepName];
      return <ResultsFolderStep stepName={stepName} step={step} />;
    });
  }
}

class ResultsFolder extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.fileUrl = props.filePath;
    this.filePath = this.fileUrl.split("/");
    this.stageDict = props.fileList;
    this.sampleName = props.sampleName;
    this.projectName = props.projectName;
  }

  gotoPath(path) {
    location.href = `${path}`;
  }

  render() {
    return (
      <div className="results-folder">
        <div className="header">
          <span className="title">
            <span className="back" onClick={this.gotoPath.bind(this, "/")}>
              {this.filePath[0]}
            </span>
            <span className="path">{">"}</span>
            <span
              className="back"
              onClick={this.gotoPath.bind(
                this,
                `/home?project_id=${this.filePath[1]}`
              )}
            >
              {this.projectName}
            </span>
            <span className="path">/</span>
            <span
              className="back"
              onClick={this.gotoPath.bind(this, `/samples/${this.filePath[2]}`)}
            >
              {this.sampleName}
            </span>
            <span className="path">/</span>
            {this.filePath[3]}
          </span>
        </div>
        <div className="header">
          {!Object.keys(this.stageDict).length
            ? "No files to show"
            : Object.keys(this.stageDict).map((stageName, k) => {
                let stage = this.stageDict[stageName];
                let stageDescription = stage["stage_description"];
                let stageDagJson = stage["stage_dag_json"];
                let stepDict = stage["steps"];
                return (
                  <table>
                    <thead>
                      <tr>
                        <th>
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
        </div>
      </div>
    );
  }
}

export default ResultsFolder;
