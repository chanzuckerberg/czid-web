import { Callout } from "czifui";
import React from "react";
import { StickyContainer, Sticky } from "react-sticky";

import { getAMRCounts } from "~/api/amr";
import { trackEvent } from "~/api/analytics";
import { getSampleMetadataFields } from "~/api/metadata";
import ErrorBoundary from "~/components/ErrorBoundary";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import { ViewHeader, NarrowContainer } from "~/components/layout";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { AMR_V1_FEATURE } from "~/components/utils/features";
import {
  processMetadata,
  processMetadataTypes,
} from "~/components/utils/metadata";
import AMRHeatmapControls from "~/components/views/amr_heatmap/AMRHeatmapControls";
import AMRHeatmapVis from "~/components/views/amr_heatmap/AMRHeatmapVis";
import { DownloadButtonDropdown } from "~ui/controls/dropdowns";
import { createCSVObjectURL } from "~utils/csv";

import cs from "./amr_heatmap_view.scss";

const METRICS = [
  { text: "Coverage", value: "coverage" },
  { text: "Depth", value: "depth" },
  { text: "RPM (reads per million)", value: "rpm" },
  { text: "DPM (depth per million)", value: "dpm" },
  { text: "Mapped Reads", value: "total_reads" },
];

const VIEW_LEVELS = [
  { text: "Genes", value: "gene" },
  { text: "Alleles", value: "allele" },
];

const SCALES = [
  { text: "Logarithmic", value: "symlog" },
  { text: "Linear", value: "linear" },
];

const SIDEBAR_SAMPLE_MODE = "sampleDetails";
const SIDEBAR_GENE_MODE = "geneDetails";

interface AMRHeatmapViewProps {
  sampleIds?: $TSFixMe[];
}

interface AMRHeatmapViewState {
  loading: boolean;
  samplesWithAMRCounts: $TSFixMe;
  selectedOptions: $TSFixMe;
  samplesMetadataTypes: $TSFixMe;
  sampleLabels?: $TSFixMe;
  geneLabels?: $TSFixMe;
  alleleLabels?: $TSFixMe;
  alleleToGeneMap?: $TSFixMe;
  maxValues: $TSFixMe;
  rawSampleData: $TSFixMe;
  selectedSampleId: $TSFixMe;
  selectedGene: $TSFixMe;
  sidebarVisible: boolean;
  sidebarMode: $TSFixMe;
}

export default class AMRHeatmapView extends React.Component<
  AMRHeatmapViewProps,
  AMRHeatmapViewState
> {
  constructor(props: AMRHeatmapViewProps) {
    super(props);

    this.state = {
      loading: true,
      maxValues: null,
      rawSampleData: null,
      samplesWithAMRCounts: null,
      samplesMetadataTypes: null,
      selectedOptions: {
        metric: "coverage",
        viewLevel: "gene",
        scale: "symlog",
      },
      selectedSampleId: null,
      selectedGene: null,
      sidebarVisible: false,
      sidebarMode: null,
    };
  }

  componentDidMount() {
    const { sampleIds } = this.props;
    this.requestSampleData(sampleIds);
  }

  async requestSampleData(sampleIds) {
    const [rawSampleData, rawSamplesMetadataTypes] = await Promise.all([
      getAMRCounts(sampleIds),
      // @ts-expect-error Expected 2 arguments, but got 1.
      getSampleMetadataFields(sampleIds),
    ]);
    const filteredSamples = rawSampleData.filter(
      (sampleData: $TSFixMe) => sampleData.error === "",
    );
    const samplesWithKeyedMetadata = filteredSamples.map(
      (sample: { metadata: $TSFixMe }) => ({
        ...sample,
        metadata: processMetadata({ metadata: sample.metadata, flatten: true }),
      }),
    );
    const samplesWithAMRCounts = this.correctSampleAndGeneNames(
      samplesWithKeyedMetadata,
    );
    const maxValues = this.findMaxValues(samplesWithAMRCounts);
    const samplesMetadataTypes = processMetadataTypes(rawSamplesMetadataTypes);
    const sampleLabels = this.extractSampleLabels(samplesWithAMRCounts);
    const [geneLabels, alleleLabels] = this.extractGeneAndAlleleLabels(
      samplesWithAMRCounts,
    );
    const alleleToGeneMap = this.mapAllelesToGenes(samplesWithAMRCounts);
    this.setState({
      rawSampleData,
      samplesWithAMRCounts,
      maxValues,
      samplesMetadataTypes,
      sampleLabels,
      geneLabels,
      alleleLabels,
      alleleToGeneMap,
      loading: false,
    });
  }

  correctSampleAndGeneNames(filteredSamples: $TSFixMe[]) {
    const sampleNamesCounts = new Map();
    filteredSamples.forEach(sample => {
      // Keep track of samples with the same name, which may occur if
      // a user selects samples from multiple projects.
      if (sampleNamesCounts.has(sample.sampleName)) {
        // Append a number to a sample's name to differentiate between samples with the same name.
        const count = sampleNamesCounts.get(sample.sampleName);
        const originalName = sample.sampleName;
        sample.sampleName = `${sample.sampleName} (${count})`;
        sampleNamesCounts.set(originalName, count + 1);
      } else {
        sampleNamesCounts.set(sample.sampleName, 1);
      }

      sample.amrCounts.forEach((amrCount: { gene: string }) => {
        // The following three lines are a kind of hacky workaround to the fact that
        // the amr counts stored in the db have a gene name that includes the actual gene
        // plus the drug class.
        // Only needed for samples run on pipeline 3.8 or earlier.
        const geneNameExtractionRegex = /[^_]+/; // matches everything before the first underscore
        const geneName = geneNameExtractionRegex.exec(amrCount.gene)[0];
        amrCount.gene = geneName;
      });
    });

    return filteredSamples;
  }

  assembleControlOptions() {
    // Controls are arranged in the order they are presented in
    return [
      { key: "viewLevel", options: VIEW_LEVELS, label: "View Level" },
      { key: "metric", options: METRICS, label: "Metric" },
      { key: "scale", options: SCALES, label: "Scale" },
    ];
  }

  findMaxValues(samplesWithAMRCounts: $TSFixMe[]) {
    const maxValues = samplesWithAMRCounts.reduce(
      (accum, currentSample) => {
        currentSample.amrCounts.forEach((amrCount: $TSFixMe) => {
          accum.depth = Math.max(accum.depth, amrCount.depth);
          accum.coverage = Math.max(accum.coverage, amrCount.coverage);
          accum.rpm = Math.max(accum.rpm, amrCount.rpm || 0);
          accum.dpm = Math.max(accum.dpm, amrCount.dpm || 0);
          accum.total_reads = Math.max(
            accum.total_reads,
            amrCount.total_reads || 0,
          );
        });
        return accum;
      },
      { depth: 0, coverage: 0, rpm: 0, dpm: 0, total_reads: 0 },
    );
    return maxValues;
  }

  hasDataToDisplay(samplesWithAMRCounts: $TSFixMe[]) {
    return samplesWithAMRCounts.some(sample => sample.amrCounts.length > 0);
  }

  // Sometimes, when presenting the tooltip popup as a user hovers over
  // a node on the heatmap, they will be over a node where the row is
  // an allele and the column is a sample with no AMR count for the allele.
  // With no AMR count, there's no easy way to grab the name of the gene
  // for the allele. Hence the allele-to-gene mapping.
  mapAllelesToGenes(sampleData: $TSFixMe[]) {
    const alleleToGeneMap = {};
    sampleData.forEach(sample => {
      sample.amrCounts.forEach(
        (amrCount: {
          allele: string | number;
          annotation_gene: $TSFixMe;
          gene: $TSFixMe;
        }) => {
          alleleToGeneMap[amrCount.allele] =
            amrCount.annotation_gene || amrCount.gene;
        },
      );
    });
    return alleleToGeneMap;
  }

  extractSampleLabels(sampleData: $TSFixMe[]) {
    const sampleLabels = sampleData.map(sample => {
      return {
        label: sample.sampleName,
        id: sample.sampleId,
        metadata: sample.metadata,
      };
    });
    return sampleLabels;
  }

  extractGeneAndAlleleLabels(sampleData: $TSFixMe[]) {
    const genes = {};
    const alleles = {};
    sampleData.forEach(sample => {
      sample.amrCounts.forEach((amrCount: $TSFixMe) => {
        if (
          amrCount.annotation_gene === null ||
          amrCount.annotation_gene === undefined
        ) {
          genes[amrCount.gene] = true;
        } else {
          genes[amrCount.annotation_gene] = true;
        }
        alleles[amrCount.allele] = true;
      });
    });
    const geneLabels = Object.keys(genes).map(gene => {
      return { label: gene };
    });
    const alleleLabels = Object.keys(alleles).map(allele => {
      return { label: allele };
    });

    return [geneLabels, alleleLabels];
  }

  // *** Callback methods ***

  updateOptions = (options: $TSFixMe) => {
    const { selectedOptions } = this.state;
    const newOptions = Object.assign({}, selectedOptions, options);
    this.setState({
      selectedOptions: newOptions,
    });
    trackEvent("AMRHeatmapView_options_changed", {
      control: Object.keys(options)[0],
      option: Object.values(options)[0],
    });
  };

  onSampleLabelClick = (sampleId: $TSFixMe) => {
    const { sidebarVisible, sidebarMode, selectedSampleId } = this.state;
    if (!sampleId) {
      this.closeSidebar();
      return;
    }
    if (
      sidebarVisible &&
      sidebarMode === SIDEBAR_SAMPLE_MODE &&
      selectedSampleId === sampleId
    ) {
      this.closeSidebar();
    } else {
      this.setState({
        selectedSampleId: sampleId,
        sidebarMode: SIDEBAR_SAMPLE_MODE,
        sidebarVisible: true,
      });
      trackEvent("AMRHeatmapView_sample-details-sidebar_opened", {
        sampleId: sampleId,
        sidebarMode: "sampleDetails",
      });
    }
  };

  onGeneLabelClick = (geneName: $TSFixMe) => {
    const { sidebarVisible, sidebarMode, selectedGene } = this.state;
    if (
      !geneName ||
      (sidebarVisible &&
        sidebarMode === SIDEBAR_GENE_MODE &&
        selectedGene === geneName)
    ) {
      this.closeSidebar();
    } else {
      this.setState({
        selectedGene: geneName,
        sidebarMode: SIDEBAR_GENE_MODE,
        sidebarVisible: true,
      });
      trackEvent("AMRHeatmapView_gene-details-sidebar_opened", {
        selectedGene: geneName,
        sidebarMode: "geneDetails",
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  onMetadataUpdate = (key: $TSFixMe, value: $TSFixMe) => {
    const { selectedSampleId, samplesWithAMRCounts } = this.state;
    const updatedSamples = samplesWithAMRCounts.map((sample: $TSFixMe) => {
      if (sample.sampleId !== selectedSampleId) {
        return sample;
      } else {
        sample.metadata[key] = value;
        return sample;
      }
    });
    const sampleLabels = this.extractSampleLabels(updatedSamples);
    this.setState({
      samplesWithAMRCounts: updatedSamples,
      sampleLabels,
    });
  };

  // *** Post-update methods ***

  computeHeatmapValuesForCSV() {
    const { samplesWithAMRCounts } = this.state;

    const csvRows = [];

    samplesWithAMRCounts.forEach(
      (sample: { amrCounts: $TSFixMe[]; sampleName: $TSFixMe }) => {
        // Each sample may have multiple amr counts.
        // Add a separate row for each amr count.
        sample.amrCounts.forEach(amrCount => {
          const row = [
            `${sample.sampleName},${amrCount.gene},${amrCount.allele},${
              amrCount.coverage
            },${amrCount.depth},${amrCount.rpm || "N/A"},${amrCount.dpm ||
              "N/A"},${amrCount.total_reads || "N/A"}`,
          ];

          csvRows.push(row);
        });
      },
    );

    const csvHeaders = [
      "sample_name,gene_name,allele_name,coverage,depth,rpm,dpm,mapped_reads",
    ];
    return [csvHeaders, csvRows];
  }

  getSidebarParams() {
    const { sidebarMode, selectedSampleId, selectedGene } = this.state;
    switch (sidebarMode) {
      case SIDEBAR_SAMPLE_MODE: {
        return {
          sampleId: selectedSampleId,
          showReportLink: true,
          onMetadataUpdate: this.onMetadataUpdate,
        };
      }
      case SIDEBAR_GENE_MODE: {
        return {
          geneName: selectedGene,
        };
      }
      default:
        break;
    }
  }

  getDownloadCSVLink() {
    const [csvHeaders, csvRows] = this.computeHeatmapValuesForCSV();
    return (
      <a
        href={createCSVObjectURL(csvHeaders, csvRows)}
        download="idseq_amr_heatmap_values.csv"
        target="_blank"
        rel="noopener noreferrer"
        key={"Download_CSV_link"}
        onClick={() => trackEvent("AMRHeatmapView_download-csv-table_clicked")}
      >
        Download CSV
      </a>
    );
  }

  getDownloadOptions() {
    return [{ text: this.getDownloadCSVLink(), value: "csv" }];
  }

  // *** Render methods ***

  renderHeader() {
    const { loading } = this.state;
    return (
      <ViewHeader className={cs.viewHeader}>
        <ViewHeader.Content>
          <ViewHeader.Pretitle breadcrumbLink={"/home"}>
            Discovery View
          </ViewHeader.Pretitle>
          <ViewHeader.Title label={"Antimicrobial Resistance Heatmap"} />
        </ViewHeader.Content>
        {!loading && (
          <ViewHeader.Controls className={cs.controls}>
            <DownloadButtonDropdown
              className={cs.controlElement}
              options={this.getDownloadOptions()}
              onClick={() =>
                trackEvent("AMRHeatmapView_download-button-dropdown_clicked")
              }
              disabled={loading}
            />
          </ViewHeader.Controls>
        )}
      </ViewHeader>
    );
  }

  renderControls() {
    const { selectedOptions, loading, maxValues } = this.state;
    const maxValueForLegend = maxValues ? maxValues[selectedOptions.metric] : 0;
    return (
      <AMRHeatmapControls
        controls={this.assembleControlOptions()}
        selectedOptions={selectedOptions}
        onSelectedOptionsChange={this.updateOptions}
        isDataReady={!loading}
        maxValueForLegend={maxValueForLegend}
      />
    );
  }

  renderDeprecationWarning() {
    return (
      <Callout className={cs.deprecationWarning} intent="info">
        This heatmap is created with data from a deprecated version of our
        Antimicrobial Resistance pipeline.{" "}
        <ExternalLink href={"https://help.czid.org/"}>Learn more.</ExternalLink>
      </Callout>
    );
  }

  renderVisualization() {
    const {
      loading,
      samplesWithAMRCounts,
      selectedOptions,
      samplesMetadataTypes,
      sampleLabels,
      geneLabels,
      alleleLabels,
      alleleToGeneMap,
    } = this.state;
    if (loading) {
      return (
        <LoadingMessage message="Loading..." className={cs.loadingIndicator} />
      );
    } else if (!this.hasDataToDisplay(samplesWithAMRCounts)) {
      return (
        <p className={cs.noDataMsg}>
          No Antimicrobial Resistance data for selected samples.
        </p>
      );
    }
    return (
      <div className="row visualization-content">
        <ErrorBoundary>
          <AMRHeatmapVis
            samplesWithAMRCounts={samplesWithAMRCounts}
            selectedOptions={selectedOptions}
            onSampleLabelClick={this.onSampleLabelClick}
            onGeneLabelClick={this.onGeneLabelClick}
            samplesMetadataTypes={samplesMetadataTypes}
            sampleLabels={sampleLabels}
            geneLabels={geneLabels}
            alleleLabels={alleleLabels}
            alleleToGeneMap={alleleToGeneMap}
            metrics={METRICS}
          />
        </ErrorBoundary>
      </div>
    );
  }

  renderSidebar() {
    const { sidebarMode, sidebarVisible } = this.state;
    return (
      <DetailsSidebar
        visible={sidebarVisible}
        mode={sidebarMode}
        onClose={this.closeSidebar}
        // @ts-expect-error 'params' signature does not match
        params={this.getSidebarParams()}
      />
    );
  }

  render() {
    const allowedFeatures = this.context?.allowedFeatures || [];

    return (
      <div className={cs.AMRHeatmapView}>
        <NarrowContainer>{this.renderHeader()}</NarrowContainer>
        <StickyContainer>
          <Sticky>
            {({ style }) => (
              <div style={style}>
                <NarrowContainer>{this.renderControls()}</NarrowContainer>
              </div>
            )}
          </Sticky>
          <NarrowContainer>
            {/* This should still be displayed even after feature flag is removed (until we've updated the heatmap) */
            allowedFeatures.includes(AMR_V1_FEATURE) &&
              this.renderDeprecationWarning()}
          </NarrowContainer>
          {this.renderVisualization()}
        </StickyContainer>
        {this.renderSidebar()}
      </div>
    );
  }
}

AMRHeatmapView.contextType = UserContext;
