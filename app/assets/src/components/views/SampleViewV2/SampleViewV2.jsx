import React from "react";
import { find, merge } from "lodash/fp";

import { getSample, getSampleReportData } from "~/api";
import PropTypes from "~/components/utils/propTypes";
import ReportTableV2 from "./ReportTable";
import SampleViewHeader from "./SampleViewHeader";
import NarrowContainer from "~/components/layout/NarrowContainer";
import cs from "./sample_view_v2.scss";

const SPECIES_LEVEL_INDEX = 1;
const GENUS_LEVEL_INDEX = 2;

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pipelineRun: null,
      project: null,
      reportData: [],
      sample: null,
    };
  }

  componentDidMount = () => {
    this.fetchSample();
    this.fetchSampleReportData();
  };

  // fetchData = () => {
  //   this.fetchSample();
  //   this.fetchSampleReportData();
  // }

  fetchSample = async () => {
    const { sampleId } = this.props;
    const sample = await getSample({ sampleId });
    this.setState({
      sample: sample,
      pipelineRun: find({ id: sample.last_pipeline_run }, sample.pipeline_runs),
      project: sample.project,
    });
  };

  fetchSampleReportData = async () => {
    const { sampleId } = this.props;

    const rawReportData = await getSampleReportData(sampleId);

    // TODO : this should come from the client
    // TODO : tax level should come as a string
    const reportData = [];
    const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
    rawReportData.sortedGenus.forEach(genusTaxId => {
      let hasHighlightedChildren = false;
      const speciesData = rawReportData.counts[GENUS_LEVEL_INDEX][
        genusTaxId
      ].children.map(speciesTaxId => {
        const isHighlighted = highlightedTaxIds.has(speciesTaxId);
        hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
        return merge(rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId], {
          highlighted: isHighlighted,
          taxId: speciesTaxId,
          taxLevel: "species",
        });
      });
      reportData.push(
        merge(rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId], {
          highlighted:
            hasHighlightedChildren || highlightedTaxIds.has(genusTaxId),
          taxId: genusTaxId,
          taxLevel: "genus",
          species: speciesData,
        })
      );
    });
    this.setState({
      reportData,
    });
    return reportData;
  };

  handlePipelineVersionSelect = newPipelineVersion => {
    const { pipelineRun, sample } = this.state;
    if (newPipelineVersion != pipelineRun.version) {
      this.setState(
        {
          pipelineRun: find(
            { id: sample.last_pipeline_run },
            sample.pipeline_runs
          ),
          reportData: [],
        },
        this.fetchSampleReportData()
      );
    }
  };

  render = () => {
    const { pipelineRun, project, reportData, sample } = this.state;

    return (
      <NarrowContainer className={cs.reportContainer}>
        <div className={cs.reportHeader}>
          <SampleViewHeader
            onPipelineVersionSelect={this.handlePipelineVersionSelect}
            pipelineRun={pipelineRun}
            project={project}
            sample={sample}
          />
        </div>
        <div className={cs.reportTable}>
          <ReportTableV2 data={reportData} />
        </div>
      </NarrowContainer>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};
