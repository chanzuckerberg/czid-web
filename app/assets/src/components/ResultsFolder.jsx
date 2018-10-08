import React from "react";

class ResultsFolder extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.fileUrl = props.filePath;
    this.filePath = this.fileUrl.split("/");
    this.fileList = props.fileList;
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
          {this.fileList.length ? (
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
              <tbody>
                {this.fileList.map((file, i) => {
                  return (
                    <tr onClick={this.download.bind(this, file.url)} key={i}>
                      <td>
                        <i className="fa fa-file" />
                        {file["display_name"]}
                        <span className="size-tag"> -- {file["size"]}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
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
