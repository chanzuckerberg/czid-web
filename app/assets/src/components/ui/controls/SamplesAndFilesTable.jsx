import React from "react";
import PropTypes from "prop-types";

class SamplesAndFilesTable extends React.Component {
  render() {
    const { sampleNamesToFiles } = this.props;

    if (sampleNamesToFiles) {
      for (const [sampleName, files] of Object.entries(
        this.props.sampleNamesToFiles
      )) {
        console.log(sampleName, files);
      }
    }
    return <div>HELLO</div>;
  }
}

SamplesAndFilesTable.propTypes = {
  // Ex: {
  //       RR004_water_2_S23: [File, File],
  //       RR007_water_2_S23: [File, File]
  //     }
  sampleNamesToFiles: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.instanceOf(File))
  )
};

export default SamplesAndFilesTable;
