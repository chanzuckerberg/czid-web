import d3 from "d3";
import textWidth from "text-width";
import { Colormap } from "../../utils/colormaps/Colormap";
import Cluster from "clusterfck";
import { mean } from "lodash/fp";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";

export default class NewHeatmap {
  constructor(container, data, options) {
    this.svg = null;
    this.g = null;
    this.container = container;
    this.data = data;

    this.options = Object.assign(
      {
        numberOfLevels: 10,
        scale: d3.scale.linear,
        // TODO: replace this colormap for a d3 based one
        colors: null,
        colorNoValue: "rgb(238, 241, 244)",
        fontSize: "9pt",
        textRotation: -65,
        marginTop: 30,
        marginLeft: 20,
        marginBottom: 100,
        marginRight: 20,
        minCellWidth: 26,
        minCellHeight: 26,
        // Currently, the sizes below exclude the margins
        minWidth: 900,
        minHeight: 400,
        clustering: true,
        rowClusterWidth: 40,
        columnClusterHeight: 40,
        spacing: 10
      },
      options
    );

    if (!this.options.colors) {
      // this.options.colors = Colormap.getNScale("viridis", this.options.numberOfLevels).reverse();
      let defaultColorScale = scaleSequential(interpolateYlOrRd);
      this.options.colors = this.range(this.options.numberOfLevels).map(i =>
        defaultColorScale(i / (this.options.numberOfLevels - 1))
      );
    }

    this.parseData();
    this.setup();
  }

  validateData() {}

  parseData() {
    this.validateData();

    this.rowLabels = this.data.rowLabels.map((label, pos) => {
      return { label, pos, shaded: false };
    });
    this.columnLabels = this.data.columnLabels.map((label, pos) => {
      return { label, pos, shaded: false };
    });

    // get heatmap size and margins from data
    this.rowLabelsWidth = 0;
    this.columnLabelsHeight = 0;

    let labelWidth = label => textWidth(label, { size: this.options.fontSize });

    for (let i = 0; i < this.rowLabels.length; i++) {
      let label = this.rowLabels[i].label;
      this.rowLabelsWidth = Math.max(this.rowLabelsWidth, labelWidth(label));
    }

    for (let j = 0; j < this.columnLabels.length; j++) {
      let label = this.columnLabels[j].label;
      this.columnLabelsHeight = Math.max(
        this.columnLabelsHeight,
        labelWidth(label)
      );
    }
    this.columnLabelsHeight *= Math.abs(
      Math.cos((90 + this.options.textRotation) * (Math.PI / 180))
    );

    // 2x'spacing' pixels for the 'x': replace by proper size
    this.rowLabelsWidth += this.options.spacing + 2 * this.options.spacing;
    this.columnLabelsHeight += this.options.spacing;

    this.limits = {
      min: d3.min(this.data.values, array => d3.min(array)),
      max: d3.max(this.data.values, array => d3.max(array))
    };

    if (this.options.clustering) {
      this.clusterRows();
      this.clusterColumns();
    }

    this.cells = [];
    for (let i = 0; i < this.rowLabels.length; i++) {
      for (let j = 0; j < this.columnLabels.length; j++) {
        this.cells.push({
          id: `${i},${j}`,
          rowIndex: i,
          columnIndex: j,
          value: this.data.values[i][j]
        });
      }
    }

    this.cell = {
      width: Math.max(
        this.options.minWidth / this.columnLabels.length,
        this.options.minCellWidth
      ),
      height: Math.max(
        this.options.minHeight / this.rowLabels.length,
        this.options.minCellHeight
      )
    };

    this.width =
      this.cell.width * this.columnLabels.length +
      this.options.marginLeft +
      this.options.marginRight +
      this.rowLabelsWidth +
      (this.options.clustering ? this.options.rowClusterWidth : 0);
    this.height =
      this.cell.height * this.rowLabels.length +
      this.options.marginTop +
      this.options.marginBottom +
      this.columnLabelsHeight +
      (this.options.clustering ? this.options.columnClusterHeight : 0);
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("class", "heatmap")
      .attr("width", this.width)
      .attr("height", this.height);

    this.g = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.options.marginLeft},${this.options.marginTop})`
      );

    this.gRowLabels = this.g
      .append("g")
      .attr("class", "row-labels")
      .attr("transform", `translate(0,${this.columnLabelsHeight})`);
    this.gColumnLabels = this.g
      .append("g")
      .attr("class", "column-labels")
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth},${this.columnLabelsHeight})`
      );
    this.gCells = this.g
      .append("g")
      .attr("class", "cells")
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth},${this.columnLabelsHeight})`
      );
    this.gRowDendogram = this.g
      .append("g")
      .attr("class", "dendogram row-dendogram")
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth +
          this.cell.width * this.columnLabels.length},${
          this.columnLabelsHeight
        })`
      );
    this.gColumnDendogram = this.g
      .append("g")
      .attr("class", "dendogram column-dendogram")
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth},${this.columnLabelsHeight +
          this.cell.height * this.rowLabels.length})`
      );
  }

  update() {
    this.renderHeatmap();
    this.renderRowLabels();
    this.renderColumnLabels();

    if (this.options.clustering) {
      if (this.rowClustering) this.renderRowDendrogram();
      if (this.columnClustering) this.renderColumnDendrogram();
    }
  }

  handleMouseOver(node) {}

  getRows() {
    let scale = this.options
      .scale()
      .domain([this.limits.min, this.limits.max])
      .range([0, 1]);

    // replacing null with zeros
    // might be space-inneficient if the matrix is too sparse
    // alternative is to create a distance function that supports nulls
    let rows = [];
    for (let i = 0; i < this.data.values.length; i++) {
      let row = this.data.values[i].slice();
      for (let j = 0; j < this.columnLabels.length; j++) {
        row[j] = scale(row[j] || 0);
      }
      row.idx = i;
      rows.push(row);
    }
    return rows;
  }

  getColumns() {
    let scale = this.options
      .scale()
      .domain([this.limits.min, this.limits.max])
      .range([0, 1]);

    let columns = [];
    for (let i = 0; i < this.columnLabels.length; i++) {
      for (let j = 0; j < this.rowLabels.length; j++) {
        if (!columns[i]) {
          columns[i] = [];
          columns[i].idx = i;
        }
        columns[i].push(scale(this.data.values[i][j] || 0));
      }
    }
    return columns;
  }

  sortTree(root) {
    if (!root) return;
    let stack = [];
    while (true) {
      while (root) {
        if (root.right) stack.push(root.right);
        stack.push(root);
        root = root.left;
      }

      root = stack.pop();
      if (root.right && stack[stack.length - 1] == root.right) {
        stack.pop();
        stack.push(root);
        root = root.right;
      } else {
        if (root.value) {
          root.mean = mean(root.value);
        } else {
          if (root.left.mean < root.right.mean) {
            [root.left, root.right] = [root.right, root.left];
          }
          root.mean = root.left.mean;
        }

        root = null;
      }
      if (!stack.length) {
        break;
      }
    }
  }

  setOrder(root, labels) {
    let stack = [];
    let order = [];

    let done = false;
    let pos = 0;
    while (!done) {
      if (root) {
        stack.push(root);
        root = root.left;
      } else {
        if (stack.length) {
          root = stack.pop();
          if (root.value) {
            labels[root.value.idx].pos = pos++;
          }
          root = root.right;
        } else {
          done = true;
        }
      }
    }
    return order;
  }

  clusterRows() {
    let rows = this.getRows();
    this.rowClustering = Cluster.hcluster(rows);
    this.sortTree(this.rowClustering);
    this.setOrder(this.rowClustering, this.rowLabels);
  }

  clusterColumns() {
    let columns = this.getColumns();
    this.columnClustering = Cluster.hcluster(columns);
    this.sortTree(this.columnClustering);
    this.setOrder(this.columnClustering, this.columnLabels);
  }

  range(n) {
    return Array.apply(null, { length: n }).map(Number.call, Number);
  }

  renderHeatmap() {
    let colorScale = this.options
      .scale()
      .domain([this.limits.min, this.limits.max])
      .range([0, this.options.colors.length - 1]);

    let cellsEnter = this.gCells
      .selectAll(".cell")
      .data(this.cells, d => d.id)
      .enter();

    cellsEnter
      .append("rect")
      .attr(
        "class",
        d => `cell cell-column-${d.columnIndex} cell-row-${d.rowIndex}`
      )
      .attr(
        "x",
        d => this.columnLabels[d.columnIndex].pos * this.cell.width + 2
      )
      .attr("y", d => this.rowLabels[d.rowIndex].pos * this.cell.height + 2)
      .attr("width", this.cell.width - 2)
      .attr("height", this.cell.height - 2)
      .style("fill", d => {
        if (!d.value && d.value !== 0) {
          return this.options.colorNoValue;
        }
        let colorIndex = Math.round(colorScale(d.value));
        return this.options.colors[colorIndex];
      })
      .on("click", this.options.onCellClick)
      .on("mouseover", d => {
        this.rowLabels[d.rowIndex].highlighted = true;
        this.columnLabels[d.columnIndex].highlighted = true;
        this.updateLabelHighlights(
          this.gRowLabels.selectAll(".row-label"),
          this.rowLabels
        );
        this.updateLabelHighlights(
          this.gColumnLabels.selectAll(".column-label"),
          this.columnLabels
        );
        // // select all cells in same
        // d3.select(".cells")
        //   .select("ce")

        // //highlight text
        // d3.select(nodes[i]).classed("cell-hover", true);
        // d3.selectAll(".rowLabel").classed("text-highlight", function(r, ri) {
        //   return ri == d.row;
        // });
        // d3.selectAll(".colLabel").classed("text-highlight", function(c, ci) {
        //   return ci == d.col;
        // });
        // d3
        //   .select(that.tooltip)
        //   .style("left", d3.event.pageX + 10 + "px")
        //   .style("top", d3.event.pageY - 10 + "px");
        // d3.select(that.tooltip).classed("hidden", false);
      })
      .on("mouseout", d => {
        this.rowLabels[d.rowIndex].highlighted = false;
        this.columnLabels[d.columnIndex].highlighted = false;
        this.updateLabelHighlights(
          this.gRowLabels.selectAll(".row-label"),
          this.rowLabels
        );
        this.updateLabelHighlights(
          this.gColumnLabels.selectAll(".column-label"),
          this.columnLabels
        );

        // d3.select(this).classed("cell-hover", false);
        // d3.selectAll(".rowLabel").classed("text-highlight", false);
        // d3.selectAll(".colLabel").classed("text-highlight", false);
        // d3.select(that.tooltip).classed("hidden", true);
      });
  }

  renderRowLabels() {
    let rowLabelEnter = this.gRowLabels
      .selectAll(".row-label")
      .data(this.rowLabels, d => d.label)
      .enter();

    let rowLabelGroup = rowLabelEnter
      .append("g")
      .attr("class", "row-label")
      .attr("transform", d => `translate(0, ${d.pos * this.cell.height})`)
      .on("mousein", this.options.onRowLabelMouseIn)
      .on("mouseout", this.options.onRowLabelMouseOut);

    rowLabelGroup
      .append("rect")
      .attr("class", "hover-target")
      .attr("width", this.rowLabelsWidth)
      .attr("height", this.cell.height)
      .style("text-anchor", "end");

    rowLabelGroup
      .append("text")
      .text(d => d.label)
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth - this.options.spacing}, ${this.cell
          .height / 2})`
      )
      .style("dominant-baseline", "central")
      .style("text-anchor", "end");

    rowLabelGroup
      .append("text")
      .attr("class", "remove-icon mono")
      .text("X")
      .attr("transform", `translate(0, ${this.cell.height / 2})`)
      .style("dominant-baseline", "central")
      .on("click", this.options.onRemoveRow);
  }

  renderColumnLabels() {
    let columnLabelEnter = this.gColumnLabels
      .selectAll(".column-label")
      .data(this.columnLabels, d => d.label)
      .enter();

    let columnLabelGroup = columnLabelEnter
      .append("g")
      .attr("class", "column-label")
      .attr("transform", d => {
        return `translate(${d.pos * this.cell.width},-${this.options.spacing})`;
      });

    columnLabelGroup
      .append("text")
      .text(d => d.label)
      .style("text-anchor", "left")
      .attr(
        "transform",
        `translate(${this.cell.width / 2},-${this.options.spacing}) rotate (${
          this.options.textRotation
        })`
      )
      .on("mousein", this.options.onColumnLabelMouseIn)
      .on("mouseout", this.options.onColumnLabelMouseOut)
      .on("click", (d, i) => {
        this.options.onColumnLabelClick(d, i);
      });
  }

  // Dendograms
  renderColumnDendrogram() {
    let width = this.cell.width * this.columnLabels.length;
    let height = this.options.columnClusterHeight - this.options.spacing;

    let container = this.gColumnDendogram.append("g");
    this.renderDendrogram(
      container,
      this.columnClustering,
      this.columnLabels,
      width,
      height
    );
    container.attr(
      "transform",
      `rotate(-90) translate(-${height + this.options.spacing},0)`
    );
  }

  renderRowDendrogram() {
    let height = this.options.rowClusterWidth - 10;
    let width = this.cell.height * this.rowLabels.length;

    let container = this.gRowDendogram.append("g");
    this.renderDendrogram(
      container,
      this.rowClustering,
      this.rowLabels,
      width,
      height
    );
    container.attr(
      "transform",
      `scale(-1,1) translate(-${this.options.rowClusterWidth},0)`
    );
  }

  updateCellHighlights() {
    this.gCells
      .selectAll(".cell")
      .data(this.cells, d => d.id)
      .classed(
        "shaded",
        d =>
          this.columnLabels[d.columnIndex].shaded ||
          this.rowLabels[d.rowIndex].shaded
      );
  }

  updateLabelHighlights(nodes, labels) {
    nodes.data(labels, d => d.label).classed("highlighted", d => d.highlighted);
  }

  renderDendrogram(container, tree, targets, width, height) {
    let cluster = d3.layout
      .cluster()
      .size([width, height])
      .separation(function() {
        return 1;
      });

    let diagonal = d => {
      return `M${d.source.y},${d.source.x}V${d.target.x}H${d.target.y}`;
    };

    let updateHighlights = (node, highlighted) => {
      let stack = [node];

      targets.forEach(target => {
        target.shaded = highlighted;
      });

      while (stack.length) {
        let node = stack.pop();
        node.highlighted = highlighted;
        if (node.left) stack.push(node.left);
        if (node.right) stack.push(node.right);

        if (highlighted && node.value && node.value.idx >= 0) {
          targets[node.value.idx].shaded = !highlighted;
        }
      }

      container
        .selectAll(".link")
        .data(cluster.links(nodes))
        .classed("highlighted", d => d.source.highlighted);

      this.updateCellHighlights();
    };

    cluster.children(function(d) {
      let children = [];
      if (d.left) {
        children.push(d.left);
      }
      if (d.right) {
        children.push(d.right);
      }
      return children;
    });

    var nodes = cluster.nodes(tree);

    let links = container
      .selectAll(".link")
      .data(cluster.links(nodes))
      .enter()
      .append("g")
      .attr("class", "link");

    links
      .append("path")
      .attr("class", "link-path")
      .attr("d", diagonal);

    links
      .append("rect")
      .attr("class", "hover-target")
      .attr("x", d => Math.min(d.source.y, d.target.y))
      .attr("y", d => Math.min(d.source.x, d.target.x))
      .attr("width", d => {
        let targetY = Math.max(d.source.left.y, d.source.right.y);
        return Math.abs(targetY - d.source.y) + this.options.spacing;
      })
      .attr("height", d => Math.abs(d.target.x - d.source.x))
      .on("mouseover", d => {
        updateHighlights(d.source, true);
      })
      .on("mouseout", d => {
        updateHighlights(d.source, false);
      });
  }
}
