import { filter, some } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { parseCSVBlob } from "~/components/utils/csv";
import FilePicker from "./FilePicker";

class CSVUpload extends React.Component {
  state = {
    file: null,
  };

  removeEmptyRowsFromCSV = csv => ({
    headers: csv.headers,
    rows: filter(row => some(val => val !== "", row), csv.rows),
  });

  onChange = accepted => {
    const { removeEmptyRows } = this.props;

    const fileReader = new FileReader();
    fileReader.onload = event => {
      let csv = parseCSVBlob(event.target.result);

      if (removeEmptyRows) {
        csv = this.removeEmptyRowsFromCSV(csv);
      }

      this.props.onCSV(csv);
    };
    fileReader.readAsText(accepted[0]);
    this.setState({
      file: accepted[0],
    });
  };

  render() {
    const { title } = this.props;

    return (
      <FilePicker
        className={this.props.className}
        title={title}
        onChange={this.onChange}
        file={this.state.file}
      />
    );
  }
}

CSVUpload.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  onCSV: PropTypes.func.isRequired,
  // Deleting in Excel may leave a row of ""s in the CSV. This option lets you filter them out.
  removeEmptyRows: PropTypes.bool,
};

export default CSVUpload;
