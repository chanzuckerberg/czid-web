import React from "react";
import PropTypes from "prop-types";
import { getSampleReportData } from "~/api";
import ReportTable from "./ReportTableV2";

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    console.log("sample view v2");
  }

  componentDidMount() {
    this.fetchSampleReportData();
  }

  fetchSampleReportData = async () => {
    const { sampleId } = this.props;

    const reportData = await getSampleReportData(sampleId);
    console.log(reportData);
  };

  render = () => {
    return (
      <div>
        <div>Report page here</div>
        <div>
          <ReportTable />
        </div>
      </div>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
