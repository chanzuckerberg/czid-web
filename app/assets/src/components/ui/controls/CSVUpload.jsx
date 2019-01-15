import React from "react";
import FilePicker from "./FilePicker";
import PropTypes from "prop-types";
import { parseCSVBlob } from "~/components/utils/csv";

class CSVUpload extends React.Component {
  state = {
    file: null
  };

  onChange = accepted => {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      const csv = parseCSVBlob(event.target.result);
      this.props.onCSV(csv);
    };
    fileReader.readAsText(accepted[0]);
    this.setState({
      file: accepted[0]
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
  onCSV: PropTypes.func.isRequired
};

export default CSVUpload;
