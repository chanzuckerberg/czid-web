import d3 from "d3";
import textWidth from "text-width";
import { Colormap } from "../../utils/colormaps/Colormap";

export default class NewHeatmap {
  constructor(container, data, options) {
    this.svg = null;
    this.g = null;
    this.container = container;
    this.data = data;

    this.options = Object.assign(
      {
        scale: d3.scale.linear,
        // TODO: replace this colormap for a d3 based one
        colors: Colormap.getNScale("viridis", 10).reverse(),
        colorNoValue: "rgb(238, 241, 244)",
        textRotation: 25,
        minMarginTop: 15,
        minMarginLeft: 40,
        minMarginBottom: 80,
        minMarginRight: 20,
        minCellWidth: 20,
        minCellHeight: 20,
        // Currently, the sizes below exclude the margins
        minWidth: 900,
        minHeight: 400
      },
      options
    );

    this.analyzeData();
    this.setup();
  }

  validateData() {}

  analyzeData() {
    this.validateData();

    // get heatmap size and margins from data
    let rowLabels = this.data.rowLabels;
    let columnLabels = this.data.columnLabels;
    let longestRowLabel = 0;
    let longestColumnLabel = 0;

    let labelWidth = label => textWidth(label, { size: "8pt" });

    console.log(this.data);
    for (let i = 0; i < rowLabels.length; i++) {
      let label = this.data.rowLabels[i];
      longestRowLabel = Math.max(longestRowLabel, labelWidth(label));
    }

    for (let j = 0; j < columnLabels.length; j++) {
      let label = this.data.columnLabels[j];
      longestColumnLabel = Math.max(longestColumnLabel, labelWidth(label));
    }

    this.cells = [];
    for (let i = 0; i < rowLabels.length; i++) {
      for (let j = 0; j < columnLabels.length; j++) {
        this.cells.push({
          id: `${i},${j}`,
          rowIndex: i,
          columnIndex: j,
          value: this.data.values[i][j]
        });
      }
    }

    this.limits = {
      min: d3.min(this.data.values, array => d3.min(array)),
      max: d3.max(this.data.values, array => d3.max(array))
    };
    console.log(this.limits);
    this.margins = {
      top:
        longestColumnLabel *
          Math.cos(this.options.textRotation * (Math.PI / 180)) +
        this.options.minMarginTop,
      left: Math.max(
        Math.ceil(Math.sqrt(rowLabels.length)) * 10,
        this.options.minMarginLeft
      ),
      bottom: this.options.minMarginBottom,
      right: longestRowLabel + this.options.minMarginRight
    };

    console.log(this.margins);
    this.cell = {
      width: Math.max(
        this.options.minWidth / columnLabels.length,
        this.options.minCellWidth
      ),
      height: Math.max(
        this.options.minHeight / rowLabels.length,
        this.options.minCellHeight
      )
    };
    console.log(this.cell);
    this.width =
      this.cell.width * columnLabels.length +
      this.margins.left +
      this.margins.right;
    this.height =
      this.cell.height * rowLabels.length +
      this.margins.top +
      this.margins.bottom;
    console.log(this.width);
    console.log(this.height);
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.g = this.svg
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margins.left + "," + this.margins.top + ")"
      );

    this.gRowLabels = this.g.append("g").attr("class", "row-labels");
    this.gColumnLabels = this.g.append("g").attr("class", "column-labels");
    this.gCells = this.g.append("g").attr("class", "cells");
  }

  update() {
    this.renderHeatmap();
    this.renderRowLabels();
    this.renderColumnLabels();
    // this.renderColumnDendrogram();
    // this.renderRowDendrogram();
  }

  handleMouseOver(node) {}

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
      .attr("class", d => `cell cell-${d.columnIndex}-${d.rowIndex}`)
      .attr("x", d => d.columnIndex * this.cell.width)
      .attr("y", d => d.rowIndex * this.cell.height)
      .attr("width", this.cell.width)
      .attr("height", this.cell.height)
      .style("fill", d => {
        if (!d.value && d !== 0) {
          console.log("returning", this.options.colorNoValue);
          return this.options.colorNoValue;
        }
        let colorIndex = Math.round(colorScale(d.value));
        return this.options.colors[colorIndex];
      })
      .on("click", this.options.onCellClick)
      .on("mouseover", (d, i, nodes) => {
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
      .on("mouseout", (d, i, nodes) => {
        // d3.select(this).classed("cell-hover", false);
        // d3.selectAll(".rowLabel").classed("text-highlight", false);
        // d3.selectAll(".colLabel").classed("text-highlight", false);
        // d3.select(that.tooltip).classed("hidden", true);
      });
  }

  renderRowLabels() {
    let rowLabelEnter = this.gRowLabels
      .selectAll(".row-label")
      .data(this.data.rowLabels)
      .enter();

    let rowLabelGroup = rowLabelEnter
      .append("g")
      .attr("class", "row-label")
      .attr(
        "transform",
        (_, i) =>
          `translate(${this.cell.width * this.data.columnLabels.length}, ${i *
            this.cell.height})`
      )
      .on("mousein", this.options.onRowLabelMouseIn)
      .on("mouseout", this.options.onRowLabelMouseOut);

    rowLabelGroup
      .append("text")
      .text(d => d)
      .attr("transform", `translate(8, ${this.cell.height / 1.5})`)
      .attr("class", (_, i) => `row-label mono r + ${i}`);

    rowLabelGroup
      .append("text")
      .attr("class", "remove-link mono")
      .text("x")
      .attr(
        "transform",
        `translate(${this.margins.right}, ${this.cell.height / 1.5})`
      )
      .style("text-anchor", "end")
      .on("click", this.options.onRemoveRow);
  }

  renderColumnLabels() {
    let columnLabelEnter = this.gColumnLabels
      .selectAll(".column-label")
      .data(this.data.columnLabels)
      .enter();

    let columnLabelGroup = columnLabelEnter
      .append("g")
      .attr("class", "column-label")
      .attr("transform", (_, i) => `translate(${i * this.cell.width},-6)`);

    columnLabelGroup
      .append("text")
      .text(d => d)
      .style("text-anchor", "left")
      .attr("transform", `translate(${this.cell.width / 2},-6) rotate (-65)`)
      .attr("class", (_, i) => `colLabel mono c${i}`)
      .on("mousein", this.options.onColumnLabelMouseIn)
      .on("mouseout", this.options.onColumnLabelMouseOut)
      .on("click", (d, i) => {
        this.options.onColumnLabelClick(d, i);
      });
  }

  // Dendograms
  renderColumnDendrogram() {
    let width = this.cell.width * this.data.columnLabels.length,
      height = this.margins.bottom - 20;

    let topOffset =
      this.margins.top + this.cell.height * this.data.rowLabels.length + 10;
    let container = this.renderDendrogram(
      this.colTree,
      width,
      height,
      "cc",
      this.colLabel
    );
    container.attr(
      "transform",
      "rotate(90) translate(" +
        top_offset +
        ", -" +
        (width + this.margin.left) +
        ")"
    );
    container
      .select("g")
      .attr(
        "transform",
        "scale(-1, 1) translate(-" + (this.margin.bottom - 20) + ", 0)"
      );
  }

  renderRowDendrogram() {
    let height = this.margin.left - 20,
      width = this.cellHeight * this.row_number;

    let container = this.renderDendrogram(
      this.rowTree,
      width,
      height,
      "cr",
      this.rowLabel
    );
    container.attr("transform", "translate(10, " + this.margin.top + ")");
  }

  renderDendrogram(tree, width, height, cssClass, labels) {
    var cluster = d3.layout
      .cluster()
      .size([width, height])
      .separation(function() {
        return 1;
      });

    let diagonal = d => {
      return (
        "M" +
        d.source.y +
        "," +
        d.source.x +
        "V" +
        d.target.x +
        "H" +
        d.target.y
      );
    };

    let visContainer = this.svg
      .append("g")
      .attr("width", width)
      .attr("height", height);

    let vis = visContainer.append("g");

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

    let i = 0;
    for (let n of nodes) {
      n.id = i;
      i += 1;
    }
    vis
      .selectAll("path.link." + cssClass + "-link")
      .data(cluster.links(nodes))
      .enter()
      .append("path")
      .attr("class", function(e) {
        return (
          "link " +
          cssClass +
          "-link " +
          cssClass +
          "-link-" +
          e.source.id +
          "-" +
          e.target.id
        );
      })
      .attr("d", diagonal);

    vis
      .selectAll("rect.hover-target." + cssClass + "-hover-target")
      .data(cluster.links(nodes))
      .enter()
      .append("rect")
      .attr("class", function(e) {
        return (
          "hover-target " +
          cssClass +
          "-hover-target " +
          cssClass +
          "-hover-" +
          e.source.id +
          "-" +
          e.target.id
        );
      })
      .attr("x", function(d) {
        return Math.min(d.source.y, d.target.y);
      })
      .attr("y", function(d) {
        return Math.min(d.source.x, d.target.x);
      })
      .attr("width", function(d) {
        let targetY = Math.max(d.source.left.y, d.source.right.y);
        return Math.abs(targetY - d.source.y);
      })
      .attr("height", function(d) {
        return Math.abs(d.target.x - d.source.x);
      })
      .attr("fill", "rgba(0,0,0,0)")
      .on("mouseover", d => {
        d3.selectAll(".heatmap").classed("highlighting", true);
        let base = d.source.children.slice();
        let to_visit = base;
        while (to_visit.length > 0) {
          let node = to_visit.pop();
          if (node.left) {
            to_visit.push(node.left);
          }
          if (node.right) {
            to_visit.push(node.right);
          }
          let cls = "." + cssClass + "-link-" + node.parent.id + "-" + node.id;
          d3.selectAll(cls).classed("link-hover", true);
          i;

          if (node.label) {
            let idx = labels.indexOf(node.label);
            let selector = "." + cssClass + idx;
            d3.selectAll(selector).classed("highlight", true);
          }
        }
      })
      .on("mouseout", function() {
        d3.selectAll(".heatmap").classed("highlighting", false);
        d3.selectAll("." + cssClass + "-link").classed("link-hover", false);
        d3.selectAll(".heatmap .highlight").classed("highlight", false);
      });
    return visContainer;
  }
}
