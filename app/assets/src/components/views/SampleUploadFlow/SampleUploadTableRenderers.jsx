import React from "react";

import cs from "./sample_upload_table_renderers.scss";

export default class SampleUploadTableRenderers extends React.Component {
  static renderFileNames = ({ cellData: fileNames }) => {
    return (
      <div>
        {fileNames.map(fileName => (
          <div key={fileName} className={cs.fileName}>
            {fileName}
          </div>
        ))}
      </div>
    );
  };
}
