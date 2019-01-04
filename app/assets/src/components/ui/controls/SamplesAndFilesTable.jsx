import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";

class SamplesAndFilesTable extends React.Component {
  render() {
    const { samplesWithFilesList } = this.props;

    if (samplesWithFilesList) {
      return (
        <div>
          something here
          <DataTable
            headers={{ sampleName: "Sample Name", files: "Files" }}
            columns={["sampleName", "files"]}
            data={samplesWithFilesList}
          />
        </div>
      );
    } else {
      return <div>nothing here</div>;
    }
  }
}

SamplesAndFilesTable.propTypes = {
  // Ex: [
  //       { RR004_water_2_S23: [File, File] },
  //       { RR007_water_2_S23: [File, File] }
  //     ]
  // sampleNamesToFiles: PropTypes.arrayOf(
  //   PropTypes.shape(
  //     PropTypes.objectOf()
  //   )
  // )
  //
  // options: PropTypes.arrayOf(
  //   PropTypes.shape({
  //     text: PropTypes.string.isRequired,
  //     value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  //       .isRequired
  //   })
  // ).isRequired
};

export default SamplesAndFilesTable;
