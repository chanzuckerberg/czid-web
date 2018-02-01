import React from 'react';

class ResultsFolder extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.fileUrl = props.filePath;
    this.filePath = this.fileUrl.split('/');
    this.fileList = props.fileList;
  }

  gotoPath(path) {
    location.href = `${path}`
  }

  download(url) {
    location.href = `${url}`
  }

  render() {
    return (
      <div className="results">
        <div className="header">
          <span className="title">
            <span className="back" onClick={this.gotoPath.bind(this, '/')}>{this.filePath[0]}</span>
            <span className="path">></span>
            <span className="back" onClick={this.gotoPath.bind(this, `/?project_id=${this.filePath[1]}`)}>{this.filePath[1]}</span>
            <span className="path">/</span>
            <span className="back" onClick={this.gotoPath.bind(this, `/samples/${this.filePath[2]}`)}>{this.filePath[2]}</span>
            <span className="path">/</span>
            {this.filePath[3]}
          </span>
         </div>
        <div className="header">
          { this.fileList.length ? <table>
            <thead>
            <tr>
                <th>{this.filePath[3] === 'results' ? 'Results folder' : 'Fastqs folder'}</th>
            </tr>
            </thead>
            <tbody>
            { this.fileList.map((file, i) => {
<<<<<<< HEAD
              return <tr onClick={this.download.bind(this, file.url)} key={i}><td><i className="fa fa-file" />{file['display_name']}</td></tr>
=======
              return <tr onClick={this.download.bind(this, file.url)} key={i}><td><i className="fa fa-folder-open" />{file['key'].split('/').slice(-1)[0]}</td></tr>
>>>>>>> undo reset
            })}
            </tbody>
          </table> : 'No files to show' }
        </div>
      </div>
    )
  }
}

<<<<<<< HEAD
export default ResultsFolder;
=======
export default ResultsFolder;
>>>>>>> undo reset
