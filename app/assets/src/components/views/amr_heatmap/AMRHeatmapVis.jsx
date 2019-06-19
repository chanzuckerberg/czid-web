import React from "react";
import PropTypes from "prop-types";

import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { getAMRCounts } from "~/api/amr";

import cs from "./amr_heatmap_vis.scss";

const VIEW_LEVEL_ALLELES = "allele";
const VIEW_LEVEL_GENES = "gene";

export default class AMRHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      viewLevel: VIEW_LEVEL_GENES,
      metric: "coverage",
    };

    this.heatmap = null;
  }

  componentDidMount() {
    this.requestAMRCountsData(this.props.sampleIds);
  }

  componentDidUpdate() {
    this.renderHeatmap();
  }

  async requestAMRCountsData(sampleIds) {
    const rawSampleData = await getAMRCounts(sampleIds);
    const samplesWithAMRCounts = rawSampleData.filter(
      sampleData => sampleData.error === ""
    );
    const [sampleLabels, geneLabels, alleleLabels] = this.extractLabels(
      samplesWithAMRCounts
    );
    this.setState({
      samplesWithAMRCounts,
      sampleLabels,
      geneLabels,
      alleleLabels,
    });
  }

  extractLabels(sampleData) {
    const sampleLabels = [];
    const genes = {};
    const alleles = {};
    sampleData.forEach(sample => {
      sampleLabels.push({ label: sample.sample_name });
      sample.amr_counts.forEach(amrCount => {
        genes[amrCount.gene] = true;
        alleles[amrCount.allele] = true;
      });
    });
    const geneLabels = Object.keys(genes).map(gene => {
      return { label: gene };
    });
    const alleleLabels = Object.keys(alleles).map(allele => {
      return { label: allele };
    });

    return [sampleLabels, geneLabels, alleleLabels];
  }

  //*** Following functions must be called after the component has updated ***
  //*** (i.e. after the component has requested AMR data and updated state) ***

  getHeatmapLabels() {
    const viewLevel = this.state.viewLevel;
    switch (viewLevel) {
      case VIEW_LEVEL_ALLELES: {
        return this.state.alleleLabels;
      }
      case VIEW_LEVEL_GENES: {
        return this.state.geneLabels;
      }
    }
  }

  computeHeatmapValues(rows) {
    const viewLevel = this.state.viewLevel;
    const metric = this.state.metric;
    const sampleData = this.state.samplesWithAMRCounts;
    const heatmapValues = [];
    rows.forEach(label => {
      const rowValues = [];
      const rowName = label.label;
      sampleData.forEach(sample => {
        const amrCountForRow = sample.amr_counts.find(
          amrCount => amrCount[viewLevel] === rowName
        );
        if (amrCountForRow != undefined) {
          rowValues.push(amrCountForRow[metric]);
        } else {
          rowValues.push(0);
        }
      });
      heatmapValues.push(rowValues);
    });
    return heatmapValues;
  }

  renderHeatmap() {
    const rows = this.getHeatmapLabels();
    const columns = this.state.sampleLabels;
    const values = this.computeHeatmapValues(rows);
    this.heatmap = new Heatmap(
      this.heatmapContainer,
      // Data for the Heatmap
      // The Heatmap expects values to be listed by rows, and rows and values are rendered in reverse order.
      // That is, the first array in "values" is rendered on the bottom; and the leftmost value is rendered
      // in the rightmost box, and vice versa.
      {
        rowLabels: rows,
        columnLabels: columns,
        values: values,
      },
      // Custom options:
      {}
    );
    this.heatmap.start();
  }

  render() {
    return (
      <div className={cs.AMRHeatmapVis}>
        <div
          className={cs.AMRHeatmapContainer}
          ref={container => {
            this.heatmapContainer = container;
          }}
        />
      </div>
    );
  }
}

AMRHeatmapVis.propTypes = {
  sampleIds: PropTypes.array,
};
