import React from "react";
import Divider from "./layout/Divider";

class ResultsFolderStepList extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.stepDict = props.stepDict;
  }

  download(url) {
    if (url) {
      location.href = `${url}`;
    }
  }

  render() {
    return Object.keys(this.stepDict).map((step_name, i) => {
      let step = this.stepDict[step_name];
      let description = step["step_description"];
      let reads_after = step["reads_after"];
      let fileList = step["file_list"];
      return (
        <tbody key={i}>
          <tr key="first">
            <td>
              Step <b>{step_name}</b>: {description}{" "}
              {reads_after ? (
                <span>
                  (<b>{reads_after}</b> reads remained.)
                </span>
              ) : null}
            </td>
          </tr>
          {fileList.map((file, j) => {
            return (
              <tr
                className={`${file.url ? "" : "disabled-"}file-link`}
                onClick={this.download.bind(this, file.url)}
                key={j}
              >
                <td>
                  <i className="fa fa-file" />
                  {file["display_name"]}
                  <span className="size-tag"> -- {file["size"]}</span>
                </td>
              </tr>
            );
          })}
          <tr key="last">
            <td>
              <Divider />
            </td>
          </tr>
        </tbody>
      );
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

  download(url) {
    if (url) {
      location.href = `${url}`;
    }
  }

  download_string2file(str) {
    let file = new Blob([str], { type: "text/plain" });
    let download_url = URL.createObjectURL(file);
    location.href = `${download_url}`;
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
            : Object.keys(this.stageDict).map((stage_name, k) => {
                let stage = this.stageDict[stage_name];
                let stage_description = stage["stage_description"];
                let stage_dag_json = stage["stage_dag_json"];
                let stepDict = stage["steps"];
                return (
                  <table>
                    <thead>
                      <tr>
                        <th>
                          {stage_name}: {stage_description}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          className="file-link"
                          onClick={this.download_string2file.bind(
                            this,
                            stage_dag_json
                          )}
                        >
                          <i className="fa fa-file" />
                          config.json
                        </td>
                      </tr>
                      <tr key="last">
                        <td>
                          <Divider />
                        </td>
                      </tr>
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
