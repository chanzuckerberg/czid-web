import React from "react";
import PropTypes from "prop-types";
import { merge } from "lodash/fp";
import { getSampleReportData } from "~/api";
import ReportTableV2 from "./ReportTableV2";
import NarrowContainer from "~/components/layout/NarrowContainer";
import cs from "./sample_view_v2.scss";

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
    };
  }

  componentDidMount() {
    this.fetchSampleReportData();
  }

  fetchSampleReportData = async () => {
    const { sampleId } = this.props;

    const reportData = await getSampleReportData(sampleId);

    // TODO : this should come from the client
    // TODO : tax level should come as a string
    const data = [];
    const highlightedTaxIds = new Set(reportData.highlightedTaxIds);
    reportData.sortedGenus.forEach(genusTaxId => {
      let hasHighlightedChildren = false;
      const speciesData = reportData.counts[2][genusTaxId].children.map(
        speciesTaxId => {
          const isHighlighted = highlightedTaxIds.has(speciesTaxId);
          hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
          return merge(reportData.counts[1][speciesTaxId], {
            highlighted: isHighlighted,
            taxId: speciesTaxId,
            taxLevel: "species",
          });
        }
      );
      data.push(
        merge(reportData.counts[2][genusTaxId], {
          highlighted:
            hasHighlightedChildren || highlightedTaxIds.has(genusTaxId),
          taxId: genusTaxId,
          taxLevel: "genus",
          species: speciesData,
        })
      );
    });
    this.setState({
      data,
    });
    return data;
  };

  render = () => {
    const { data } = this.state;
    return (
      <NarrowContainer className={cs.reportContainer}>
        <div className={cs.reportTable}>
          <ReportTableV2 data={data} />
        </div>
      </NarrowContainer>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
