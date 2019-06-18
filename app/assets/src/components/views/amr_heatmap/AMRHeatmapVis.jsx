import React from "react";
import PropTypes from "prop-types";

import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { getAMRCounts } from "~/api/amr";

import cs from "./amr_heatmap_vis.scss";

const METRIC_ALLELES = "alleles";
const METRIC_GENES = "genes";

export default class AMRHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      viewLevel: METRIC_GENES,
      metric: "coverage",
    };

    this.heatmap = null;
  }

  componentDidMount() {
    console.log(this.props);
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
    const [samples, genes, alleles] = this.createLabels(samplesWithAMRCounts);
    this.setState({
      samplesWithAMRCounts,
      samples,
      genes,
      alleles,
    });
  }

  createLabels(sampleData) {
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

  createHeatmapLabels() {
    const viewLevel = this.state.viewLevel;
    switch (viewLevel) {
      case METRIC_ALLELES: {
        return this.state.alleles;
      }
      case METRIC_GENES: {
        return this.state.genes;
      }
    }
  }

  assembleAlleleValues(alleleLabels) {
    const sampleData = this.state.samplesWithAMRCounts;
    const alleleValues = {
      depth: [],
      coverage: [],
    };
    alleleLabels.forEach(allele => {
      const depth = [];
      const coverage = [];
      const geneName = allele.label;
      sampleData.forEach(sample => {
        const amrCountForGene = sample.amr_counts.find(
          amrCount => amrCount.allele === geneName
        );
        if (amrCountForGene != undefined) {
          depth.push(amrCountForGene.depth);
          coverage.push(amrCountForGene.coverage);
        } else {
          depth.push(0);
          coverage.push(0);
        }
      });
      alleleValues.depth.push(depth);
      alleleValues.coverage.push(coverage);
    });
    return alleleValues;
  }

  assembleGeneValues(geneLabels) {
    const sampleData = this.state.samplesWithAMRCounts;
    const geneValues = {
      depth: [],
      coverage: [],
    };
    geneLabels.forEach(gene => {
      const depth = [];
      const coverage = [];
      const geneName = gene.label;
      sampleData.forEach(sample => {
        const amrCountForGene = sample.amr_counts.find(
          amrCount => amrCount.gene === geneName
        );
        if (amrCountForGene != undefined) {
          depth.push(amrCountForGene.depth);
          coverage.push(amrCountForGene.coverage);
        } else {
          depth.push(0);
          coverage.push(0);
        }
      });
      geneValues.depth.push(depth);
      geneValues.coverage.push(coverage);
    });
    return geneValues;
  }

  computeHeatmapValues(rows) {
    const viewLevel = this.state.viewLevel;
    const metric = this.state.metric;
    switch (viewLevel) {
      case METRIC_ALLELES: {
        const alleleValues = this.assembleAlleleValues(rows);
        return alleleValues[metric];
      }
      case METRIC_GENES: {
        const geneValues = this.assembleGeneValues(rows);
        return geneValues[metric];
      }
      default: {
        return [];
      }
    }
  }

  renderHeatmap() {
    const rows = this.createHeatmapLabels();
    const columns = this.state.samples;
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
