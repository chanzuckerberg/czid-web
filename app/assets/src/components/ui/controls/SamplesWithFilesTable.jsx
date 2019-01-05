import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";

class SamplesWithFilesTable extends React.Component {
  render() {
    console.log("table is re-rendering");
    const { samplesWithFilesData } = this.props;
    console.log(samplesWithFilesData);

    if (samplesWithFilesData) {
      return (
        <div>
          <DataTable
            headers={{
              progress: "",
              sampleName: "Sample Name",
              files: "Files",
              deleteButton: ""
            }}
            columns={["progress", "sampleName", "files", "deleteButton"]}
            data={samplesWithFilesData}
          />
        </div>
      );
    } else {
      return <div>nothing here</div>;
    }
  }
}

SamplesWithFilesTable.propTypes = {
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

export default SamplesWithFilesTable;
