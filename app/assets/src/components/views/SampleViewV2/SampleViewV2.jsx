import React from "react";
import PropTypes from "prop-types";
import { getSampleReportData } from "~/api";
import ReportTableV2 from "./ReportTableV2";
import { merge } from "lodash/fp";

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
    };
    console.log("SampleViewV2:constructor");
  }

  componentDidMount() {
    this.fetchSampleReportData();
  }

  fetchSampleReportData = async () => {
    const { sampleId } = this.props;

    const reportData = await getSampleReportData(sampleId);
    console.log(reportData);

    // TODO : this should come from the client
    // TODO : tax level should come as a string
    const data = [];
    reportData.sortedGenus.forEach(genusTaxId => {
      // console.log(genusTaxId, reportData.counts[2][genusTaxId]);
      data.push(merge(reportData.counts[2][genusTaxId], { taxLevel: "genus" }));
      reportData.counts[2][genusTaxId].children.forEach(speciesTaxId => {
        data.push(
          merge(reportData.counts[1][speciesTaxId], { taxLevel: "species" })
        );
      });
    });
    this.setState({
      data,
    });
    return data;
  };

  render = () => {
    const { data } = this.state;
    return (
      <div>
        <div>Report page here</div>
        <div style={{ height: 500 }}>
          <ReportTableV2 data={data} />
        </div>
      </div>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
