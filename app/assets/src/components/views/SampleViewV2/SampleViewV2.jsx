import React from "react";
import { find, merge } from "lodash/fp";

import { getSample, getSampleReportData, getSamples } from "~/api";
import { UserContext } from "~/components/common/UserContext";
import { AMR_TABLE_FEATURE } from "~/components/utils/features";
import { logAnalyticsEvent } from "~/api/analytics";

import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "~/components/utils/propTypes";
import ReportTableV2 from "./ReportTable";
import SampleViewHeader from "./SampleViewHeader";
import Tabs from "~/components/ui/controls/Tabs";
import cs from "./sample_view_v2.scss";

const SPECIES_LEVEL_INDEX = 1;
const GENUS_LEVEL_INDEX = 2;

export default class SampleViewV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      backgroundId: null,
      currentTab: "Report",
      pipelineRun: null,
      project: null,
      projectSamples: [],
      reportData: [],
      sample: null,
      view: "table",
    };
  }

  componentDidMount = () => {
    this.fetchSample();
    this.fetchSampleReportData();
  };

  fetchSample = async () => {
    const { sampleId } = this.props;
    const sample = await getSample({ sampleId });
    this.setState(
      {
        sample: sample,
        pipelineRun: find(
          { id: sample.last_pipeline_run },
          sample.pipeline_runs
        ),
        project: sample.project,
      },
      this.fetchProjectSamples
    );
  };

  fetchProjectSamples = async () => {
    const { project } = this.state;

    if (project) {
      const projectSamples = await getSamples({
        projectId: project.id,
      });

      this.setState({ projectSamples: projectSamples.samples });
    }
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
      const childrenSpecies =
        rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].children;
      const speciesData = childrenSpecies.map(speciesTaxId => {
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

  handleTabChange = tab => {
    this.setState({ currentTab: tab });
    const name = tab.replace(/\W+/g, "-").toLowerCase();
    logAnalyticsEvent(`SampleView_tab-${name}_clicked`, {
      tab: tab,
    });
  };

  toggleSampleDetailsSidebar = () => {
    console.log("toggle sample details sidebar");
    // if (
    //   this.state.sidebarMode === "sampleDetails" &&
    //   this.state.sidebarVisible
    // ) {
    //   this.setState({
    //     sidebarVisible: false,
    //   });
    // } else {
    //   this.setState({
    //     sidebarMode: "sampleDetails",
    //     sidebarVisible: true,
    //   });
    // }
  };

  render = () => {
    const {
      backgroundId,
      currentTab,
      pipelineRun,
      project,
      projectSamples,
      reportData,
      sample,
      view,
    } = this.state;

    return (
      <NarrowContainer className={cs.sampleViewContainer}>
        <div className={cs.sampleViewHeader}>
          <SampleViewHeader
            backgroundId={backgroundId}
            editable={sample ? sample.editable : false}
            onDetailsClick={this.toggleSampleDetailsSidebar}
            onPipelineVersionChange={this.handlePipelineVersionSelect}
            pipelineRun={pipelineRun}
            project={project}
            projectSamples={projectSamples}
            sample={sample}
            view={view}
          />
        </div>
        <div className={cs.tabsContainer}>
          <UserContext.Consumer>
            {currentUser =>
              currentUser.allowedFeatures.includes(AMR_TABLE_FEATURE) ||
              currentUser.admin ? (
                <Tabs
                  className={cs.tabs}
                  tabs={["Report", "Antimicrobial Resistance"]}
                  value={currentTab}
                  onChange={this.handleTabChange}
                />
              ) : (
                <div className={cs.dividerContainer}>
                  <div className={cs.divider} />
                </div>
              )
            }
          </UserContext.Consumer>
        </div>
        <div className={cs.reportViewContainer}>
          <ReportTableV2 data={reportData} />
        </div>
      </NarrowContainer>
    );
  };
}

SampleViewV2.propTypes = {
  sampleId: PropTypes.number,
};

{
  /* <DetailsSidebar
visible={this.state.sidebarVisible}
mode={this.state.sidebarMode}
onClose={withAnalytics(
  this.closeSidebar,
  "SampleView_details-sidebar_closed",
  {
    sampleId: sample.id,
    sampleName: sample.name,
  }
)}
params={this.getSidebarParams()}
/>
{this.coverageVizEnabled() && (
<CoverageVizBottomSidebar
  visible={this.state.coverageVizVisible}
  onClose={withAnalytics(
    this.closeCoverageViz,
    "SampleView_coverage-viz-sidebar_closed",
    {
      sampleId: sample.id,
      sampleName: sample.name,
    }
  )}
  params={this.getCoverageVizParams()}
  sampleId={sample.id}
  pipelineVersion={this.props.pipelineRun.pipeline_version}
  nameType={this.state.nameType}
/>
)} */
}
