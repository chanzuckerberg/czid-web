import { filter, some } from "lodash/fp";
import React from "react";
import { parseCSVBlob } from "~/components/utils/csv";
import FilePicker from "./FilePicker";

interface CSVUploadProps {
  className?: string;
  title?: string;
  onCSV: $TSFixMeFunction;
  // Deleting in Excel may leave a row of ""s in the CSV. This option lets you filter them out.
  removeEmptyRows?: boolean;
}

class CSVUpload extends React.Component<CSVUploadProps> {
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
      // @ts-expect-error Argument of type 'string | ArrayBuffer' is not assignable to parameter of type 'string'
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
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        file={this.state.file}
      />
    );
  }
}

export default CSVUpload;
