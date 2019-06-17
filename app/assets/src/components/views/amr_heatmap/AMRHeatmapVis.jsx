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
      viewLevel: "genes",
      metric: "coverage",
    };

    this.heatmap = null;
  }

  componentDidMount() {
    this.requestAMRCountsData(this.props.sampleIds);
  }

  componentDidUpdate() {
    let rows = this.createHeatmapLabels();
    let columns = this.state.samples;
    let values = this.computeHeatmapValues(rows);
    let options = {};
    this.renderHeatmap(rows, columns, values, options);
  }

  async requestAMRCountsData(sampleIds) {
    let rawResponse = await getAMRCounts(sampleIds);
    let [geneData, samples] = this.extractData(rawResponse);
    let alleleToGeneMap = this.mapAllelesToGenes(geneData);
    this.setState((state, props) => {
      return {
        rawData: rawResponse,
        geneData: geneData,
        samples: samples,
        alleleToGeneMap: alleleToGeneMap,
      };
    });
  }

  extractData(rawData) {
    let genes = {};
    let sampleLabels = [];
    rawData.filter(rawSample => rawSample.error === "").forEach(sample => {
      let sampleName = sample.sample_name;
      sampleLabels.push({ label: `${sample.sample_name}` });
      sample.amr_counts.forEach(amrCount => {
        let gene = amrCount.gene;
        let allele = amrCount.allele;
        let depth = amrCount.depth;
        let coverage = amrCount.coverage;
        let genesDataStructure = {
          name: gene,
          samples: {
            [sampleName]: {
              name: sampleName,
              depth: depth,
              coverage: coverage,
            },
          },
          alleles: {
            [allele]: {
              samples: {
                [sampleName]: {
                  depth: depth,
                  coverage: coverage,
                },
              },
            },
          },
        };
        if (genes.hasOwnProperty(gene)) {
          if (genes[gene].samples.hasOwnProperty(sampleName)) {
            // do nothing for now
          } else {
            genes[gene].samples[sampleName] =
              genesDataStructure.samples[sampleName];
          }
          if (genes[gene].alleles.hasOwnProperty(allele)) {
            genes[gene].alleles[allele].samples[sampleName] =
              genesDataStructure.alleles[allele].samples[sampleName];
          } else {
            genes[gene].alleles[allele] = genesDataStructure.alleles[allele];
          }
        } else {
          genes[gene] = genesDataStructure;
        }
      });
    });
    return [genes, sampleLabels];
  }

  mapAllelesToGenes(geneData) {
    let alleleToGeneMap = {};
    Object.keys(geneData).forEach(gene => {
      let alleles = geneData[gene].alleles;
      Object.keys(alleles).forEach(allele => {
        alleleToGeneMap[allele] = gene;
      });
    });
    return alleleToGeneMap;
  }

  //*** Following functions must be called after the component has updated ***
  //*** (i.e. after the component has requested AMR data and updated state) ***

  createGeneLabels() {
    let geneData = this.state.geneData;
    let geneLabels = [];
    Object.keys(geneData).forEach(gene => {
      geneLabels.push({ label: `${gene}` });
    });
    return geneLabels;
  }

  createAlleleLabels() {
    let geneData = this.state.geneData;
    let alleleLabels = [];
    let genes = Object.keys(geneData);
    genes.forEach(gene => {
      let geneAlleles = Object.keys(geneData[gene].alleles);
      let labeledAlleles = geneAlleles.map(allele => {
        return { label: `${allele}` };
      });
      alleleLabels = alleleLabels.concat(labeledAlleles);
    });
    return alleleLabels;
  }

  createHeatmapLabels() {
    let viewLevel = this.state.viewLevel;
    switch (viewLevel) {
      case METRIC_ALLELES: {
        return this.createAlleleLabels();
        break;
      }
      case METRIC_GENES: {
        return this.createGeneLabels();
        break;
      }
    }
  }

  assembleAlleleValues(alleleLabels) {
    let geneData = this.state.geneData;
    let samples = this.state.samples;
    let alleleToGeneMap = this.state.alleleToGeneMap;
    let alleleValues = {
      depth: [],
      coverage: [],
    };
    alleleLabels.forEach(allele => {
      let depth = [];
      let coverage = [];
      let alleleName = allele.label;
      let gene = alleleToGeneMap[alleleName];
      let alleleData = geneData[gene].alleles[alleleName];
      samples.forEach(sample => {
        let sampleName = sample.label;
        if (alleleData.samples.hasOwnProperty(sampleName)) {
          depth.push(alleleData.samples[sampleName].depth);
          coverage.push(alleleData.samples[sampleName].coverage);
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
    let geneData = this.state.geneData;
    let samples = this.state.samples;
    let geneValues = {
      depth: [],
      coverage: [],
    };
    geneLabels.forEach(gene => {
      let depth = [];
      let coverage = [];
      let geneName = gene.label;
      samples.forEach(sample => {
        let sampleName = sample.label;
        if (geneData[geneName].samples.hasOwnProperty(sampleName)) {
          depth.push(geneData[geneName].samples[sampleName].depth);
          coverage.push(geneData[geneName].samples[sampleName].coverage);
        } else {
          depth.push(0), coverage.push(0);
        }
      });
      geneValues.depth.push(depth);
      geneValues.coverage.push(coverage);
    });
    return geneValues;
  }

  computeHeatmapValues(rows) {
    let viewLevel = this.state.viewLevel;
    let metric = this.state.metric;
    switch (viewLevel) {
      case METRIC_ALLELES: {
        let alleleValues = this.assembleAlleleValues(rows);
        return alleleValues[metric];
        break;
      }
      case METRIC_GENES: {
        let geneValues = this.assembleGeneValues(rows);
        return geneValues[metric];
        break;
      }
      default: {
        return [];
      }
    }
  }

  renderHeatmap(rows, columns, values, options) {
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
      options
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
