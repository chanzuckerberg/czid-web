import React from "react";

class ResultsFolder extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.fileUrl = props.filePath;
    this.filePath = this.fileUrl.split("/");
    this.stepDict = props.fileList;
    this.sampleName = props.sampleName;
    this.projectName = props.projectName;
  }

  gotoPath(path) {
    location.href = `${path}`;
  }

  download(url) {
    location.href = `${url}`;
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
          {Object.keys(this.stepDict).length ? (
            <table>
              <thead>
                <tr>
                  <th>
                    {this.filePath[3] === "results"
                      ? "Results folder"
                      : "Fastqs folder"}
                  </th>
                </tr>
              </thead>
              {Object.keys(this.stepDict).map((step_name, i) => {
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
                        <hr />
                      </td>
                    </tr>
                  </tbody>
                );
              })}
            </table>
          ) : (
            "No files to show"
          )}
        </div>
      </div>
    );
  }
}

export default ResultsFolder;
