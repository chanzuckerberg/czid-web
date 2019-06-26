import React from "react";
import PropTypes from "prop-types";

import Heatmap from "~/components/visualizations/heatmap/Heatmap";

import cs from "./amr_heatmap_vis.scss";

const VIEW_LEVEL_ALLELES = "allele";
const VIEW_LEVEL_GENES = "gene";

export default class AMRHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.heatmap = null;
  }

  componentDidMount() {
    const { samplesWithAMRCounts } = this.props;
    const [sampleLabels, geneLabels, alleleLabels] = this.extractLabels(
      samplesWithAMRCounts
    );
    this.setState({
      sampleLabels,
      geneLabels,
      alleleLabels,
    });
  }

  componentDidUpdate() {
    this.updateHeatmap();
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
    const { selectedOptions } = this.props;
    const { alleleLabels, geneLabels } = this.state;
    switch (selectedOptions.viewLevel) {
      case VIEW_LEVEL_ALLELES: {
        return alleleLabels;
      }
      case VIEW_LEVEL_GENES: {
        return geneLabels;
      }
    }
  }

  computeHeatmapValues(rows) {
    const { selectedOptions, samplesWithAMRCounts } = this.props;
    const heatmapValues = [];
    rows.forEach(label => {
      const rowValues = [];
      const rowName = label.label;
      samplesWithAMRCounts.forEach(sample => {
        const amrCountForRow = sample.amr_counts.find(
          amrCount => amrCount[selectedOptions.viewLevel] === rowName
        );
        if (amrCountForRow != undefined) {
          rowValues.push(amrCountForRow[selectedOptions.metric]);
        } else {
          rowValues.push(0);
        }
      });
      heatmapValues.push(rowValues);
    });
    return heatmapValues;
  }

  updateHeatmap() {
    const { selectedOptions } = this.props;
    const { sampleLabels } = this.state;
    const rows = this.getHeatmapLabels();
    const columns = sampleLabels;
    const values = this.computeHeatmapValues(rows);
    if (this.heatmap !== null) {
      this.heatmap.updateData({
        rowLabels: rows,
        columnLabels: columns,
        values: values,
      });
      this.heatmap.updateScale(selectedOptions.scale);
    } else {
      this.initializeHeatmap(rows, columns, values);
    }
  }

  colorFilter = (value, node, originalColor, _, colorNoValue) => {
    // Leave zero values grey
    return value > 0 ? originalColor : colorNoValue;
  };

  initializeHeatmap(rows, columns, values) {
    const { selectedOptions } = this.props;
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
      {
        scale: selectedOptions.scale,
        scaleMin: 0,
        customColorCallback: this.colorFilter,
      }
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
  samplesWithAMRCounts: PropTypes.arrayOf(
    PropTypes.shape({
      sample_name: PropTypes.string,
      sample_id: PropTypes.number,
      amr_counts: PropTypes.array,
      error: PropTypes.string,
    })
  ),
  selectedOptions: PropTypes.shape({
    metric: PropTypes.string,
    viewLevel: PropTypes.string,
    scale: PropTypes.string,
  }),
};
