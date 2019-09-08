import React from "react";
import { getSampleReportData } from "~/api";
import ReportTable from "./ReportTable";

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.gsnapFilterStatus = this.generateGsnapFilterStatus();
  }

  componentDidMount() {
    fetchSampeleReportData();
  }

  fetchSampleReportData = async () => {
    const reportData = await getSampleReportData();
    console.log(reportData);
  }

  render = () => {
    return (
      <div>
        <div>Report page here</div>
        <div>
          <ReportTable />
        </div>
      </div>
    )
  }
}
