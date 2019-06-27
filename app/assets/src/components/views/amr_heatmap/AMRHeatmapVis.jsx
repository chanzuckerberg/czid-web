import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { DataTooltip } from "~ui/containers";
import { getTooltipStyle } from "~/components/utils/tooltip";

import cs from "./amr_heatmap_vis.scss";

const VIEW_LEVEL_ALLELES = "allele";
const VIEW_LEVEL_GENES = "gene";

export default class AMRHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeHoverInfo: null,
      tooltipLocation: null,
    };

    this.heatmap = null;
  }

  componentDidMount() {
    const { samplesWithAMRCounts } = this.props;
    const [sampleLabels, geneLabels, alleleLabels] = this.extractLabels(
      samplesWithAMRCounts
    );
    const alleleToGeneMap = this.mapAllelesToGenes(samplesWithAMRCounts);
    this.setState({
      sampleLabels,
      geneLabels,
      alleleLabels,
      alleleToGeneMap,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps || this.heatmap === null) {
      this.updateHeatmap();
    }
  }

  // Sometimes, when presenting the tooltip popup as a user hovers over
  // a node on the heatmap, they will be over a node where the row is
  // an allele and the column is a sample with no AMR count for the allele.
  // With no AMR count, there's no easy way to grab the name of the gene
  // for the allele. Hence the allele-to-gene mapping.
  mapAllelesToGenes(sampleData) {
    const alleleToGeneMap = {};
    sampleData.forEach(sample => {
      sample.amr_counts.forEach(amrCount => {
        alleleToGeneMap[amrCount.allele] = amrCount.gene;
      });
    });
    return alleleToGeneMap;
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

  //*** Callback functions for the heatmap ***

  colorFilter = (value, node, originalColor, _, colorNoValue) => {
    // Leave zero values grey
    return value > 0 ? originalColor : colorNoValue;
  };

  onNodeHover = node => {
    this.setState({ nodeHoverInfo: this.getTooltipData(node) });
  };

  onNodeHoverMove = (_, event) => {
    if (event) {
      this.setState({
        tooltipLocation: {
          left: event.pageX,
          top: event.pageY,
        },
      });
    }
  };

  onNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
  };

  //*** Following functions must be called after the component has updated ***

  getTooltipData(node) {
    const { samplesWithAMRCounts, selectedOptions } = this.props;
    const {
      sampleLabels,
      geneLabels,
      alleleLabels,
      alleleToGeneMap,
    } = this.state;
    const sampleName = sampleLabels[node.columnIndex].label;
    let amrCountIdentifier = "";
    let gene = "";
    let allele = "";
    switch (selectedOptions.viewLevel) {
      case VIEW_LEVEL_ALLELES: {
        amrCountIdentifier = alleleLabels[node.rowIndex].label;
        allele = amrCountIdentifier;
        break;
      }
      case VIEW_LEVEL_GENES: {
        amrCountIdentifier = geneLabels[node.rowIndex].label;
        gene = amrCountIdentifier;
        break;
      }
      default: {
        break;
      }
    }

    const sampleForColumn = samplesWithAMRCounts[node.columnIndex];
    const amrCountForRow = sampleForColumn.amr_counts.find(
      amrCount => amrCount[selectedOptions.viewLevel] === amrCountIdentifier
    );
    let coverage = 0;
    let depth = 0;
    if (gene === "") {
      gene = alleleToGeneMap[allele];
    } else if (allele === "") {
      allele = amrCountForRow ? amrCountForRow.allele : "---";
    }
    if (amrCountForRow) {
      coverage = amrCountForRow.coverage;
      depth = amrCountForRow.depth;
    }

    return [
      {
        name: "Info",
        data: [["Sample", sampleName], ["Gene", gene], ["Allele", allele]],
      },
      {
        name: "Values",
        data: [["Coverage", `${coverage} %`], ["Depth", `${depth} x`]],
      },
    ];
  }

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
        if (amrCountForRow !== undefined) {
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
        onNodeHover: this.onNodeHover,
        onNodeHoverMove: this.onNodeHoverMove,
        onNodeHoverOut: this.onNodeHoverOut,
      }
    );
    this.heatmap.start();
  }

  renderNodeHoverTooltip() {
    const { nodeHoverInfo, tooltipLocation } = this.state;
    if (!(nodeHoverInfo && tooltipLocation)) {
      return;
    }
    return (
      <div
        className={cx(cs.tooltip, nodeHoverInfo && cs.visible)}
        style={getTooltipStyle(tooltipLocation, {
          buffer: 20,
          below: true,
        })}
      >
        <DataTooltip data={nodeHoverInfo} />
      </div>
    );
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
        {this.renderNodeHoverTooltip()}
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
