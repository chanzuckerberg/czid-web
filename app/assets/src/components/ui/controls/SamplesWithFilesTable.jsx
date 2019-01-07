import React from "react";
import PropTypes from "prop-types";
import DataTable from "../../visualizations/table/DataTable";
import { isEmpty } from "lodash/fp";

class SamplesWithFilesTable extends React.Component {
  render() {
    const { samplesWithFilesData } = this.props;

    if (!isEmpty(samplesWithFilesData)) {
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
      return null;
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
