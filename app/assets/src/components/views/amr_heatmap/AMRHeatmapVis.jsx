import React from "react";
import PropTypes from "prop-types";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { getAMRCounts } from "~/api/amr";

import cs from "./amr_heatmap_vis.scss";

export default class AMRHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.heatmap = null;
  }

  componentDidMount() {
    this.requestAMRCountsData(this.props.sampleIds);
  }

  componentDidUpdate() {
    let [geneValues, alleleValues] = this.computeHeatmapValues(
      this.state.sampleLabels,
      this.state.geneData,
      this.state.sortedLabels.genes,
      this.state.sortedLabels.alleles
    );
    let allValues = {
      genes: geneValues,
      alleles: alleleValues
    };
    let rows = this.createHeatmapLabels(this.state.viewLevel);
    let columns = this.state.sampleLabels;
    let values = allValues[this.state.viewLevel][this.state.metric];
    let options = {};
    this.renderHeatmap(rows, columns, values, options);
    console.log(this.state);
  }

  async requestAMRCountsData(sampleIds) {
    let rawResponse = await Promise.resolve(getAMRCounts(sampleIds));
    let [geneData, sampleLabels] = this.extractData(rawResponse);
    let [geneLabels, alleleLabels] = this.createGeneLabels(geneData);
    let [sortedGeneLabels, sortedAlleleLabels] = this.sortGeneLabels(
      geneLabels,
      alleleLabels,
      "alphabetical"
    );
    this.setState((state, props) => {
      return {
        rawData: rawResponse,
        geneData: geneData,
        sampleLabels: sampleLabels,
        geneLabels: geneLabels,
        alleleLabels: alleleLabels,
        sortedLabels: {
          genes: sortedGeneLabels,
          alleles: sortedAlleleLabels
        },
        viewLevel: "alleles",
        metric: "coverage"
      };
    });
  }

  extractData(rawData) {
    let genes = {};
    let sampleLabels = [];
    rawData.forEach(sample => {
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
              name: sampleName
            }
          },
          alleles: {
            [allele]: {
              samples: {
                [sampleName]: {
                  depth: depth,
                  coverage: coverage
                }
              }
            }
          }
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

  createGeneLabels(geneData) {
    let geneLabels = [];
    let alleleLabels = {};
    Object.entries(geneData).forEach(geneEntry => {
      let [gene, entry] = geneEntry;
      geneLabels.push({ label: `${gene}` });
      alleleLabels[gene] = Object.keys(entry.alleles);
    });
    return [geneLabels, alleleLabels];
  }

  // sorts the genes, then sorts the alleles according to the gene sorting.
  sortGeneLabels(genes, alleles, sorting) {
    let sortedGeneLabels = genes;
    switch (sorting) {
      case "alphabetical":
        sortedGeneLabels.sort((first, second) => {
          let firstLabel = first.label.toUpperCase();
          let secondLabel = second.label.toUpperCase();
          if (firstLabel < secondLabel) {
            return -1;
          } else if (firstLabel > secondLabel) {
            return 1;
          }
          return 0;
        });
        break;
      default:
        break;
    }
    let sortedAlleleLabels = [];
    sortedGeneLabels.forEach(gene => {
      let labeledAlleles = alleles[gene.label].map(allele => {
        return {
          label: { label: `${allele}` },
          gene: gene.label
        };
        return { label: `${allele}` };
      });
      sortedAlleleLabels = sortedAlleleLabels.concat(labeledAlleles);
    });
    return [sortedGeneLabels, sortedAlleleLabels];
  }

  createHeatmapLabels(viewLevel) {
    switch (viewLevel) {
      case "alleles":
        return this.state.sortedLabels.alleles.map(allele => {
          return allele.label;
        });
    }
  }

  // It's important to pass this function the SORTED labels.
  computeHeatmapValues(
    samples,
    geneData,
    sortedGeneLabels,
    sortedAlleleLabels
  ) {
    // TODO: Find out how to compute gene coverage and depth
    let geneValues = {
      depth: [],
      coverage: []
    };
    let alleleValues = {
      depth: [],
      coverage: []
    };
    sortedAlleleLabels.forEach(allele => {
      let depth = [];
      let coverage = [];
      let gene = allele.gene;
      let alleleName = allele.label.label;
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
    return [geneValues, alleleValues];
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
        values: values
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
  sampleIds: PropTypes.array
};
