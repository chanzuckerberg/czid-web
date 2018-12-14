import d3 from "d3";
import textWidth from "text-width";
import Cluster from "clusterfck";
import { mean } from "lodash/fp";
import { orderBy, some } from "lodash";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import SvgSaver from "svgsaver";
import symlog from "../../utils/d3/scales/symlog.js";
import cs from "./heatmap.scss";
import cx from "classnames";
import { CategoricalColormap } from "../../utils/colormaps/CategoricalColormap.js";

// TODO(tcarvalho): temporary hack to send elements to the back.
// Remove once code is ported to d3 v4, which contains this function.
d3.selection.prototype.lower = function() {
  return this.each(function() {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

export default class Heatmap {
  constructor(container, data, options) {
    this.svg = null;
    this.g = null;
    this.container = d3.select(container);
    this.data = data;
    this.svgSaver = new SvgSaver();

    this.options = Object.assign(
      {
        numberOfLevels: 10,
        scale: "linear",
        colors: null,
        colorNoValue: "#eaeaea",
        fontSize: "9pt",
        textRotation: -65,
        marginTop: 30,
        marginLeft: 20,
        marginBottom: 20,
        marginRight: 20,
        minCellWidth: 26,
        minCellHeight: 26,
        minWidth: 1240,
        minHeight: 500,
        clustering: true,
        defaultClusterStep: 6,
        maxRowClusterWidth: 100,
        maxColumnClusterHeight: 100,
        spacing: 10,
        transitionDuration: 200,
        nullValue: 0,
        columnMetadata: [],
        metadataColorScale: new CategoricalColormap(),
        enableColumnMetadata: false,
        iconPath: "/assets/icons"
      },
      options
    );

    if (!this.options.colors) {
      let defaultColorScale = scaleSequential(interpolateYlOrRd);
      this.options.colors = this.range(this.options.numberOfLevels).map(i =>
        defaultColorScale(i / (this.options.numberOfLevels - 1))
      );
    }

    this.rowClusterWidth = this.options.maxRowClusterWidth;
    this.columnClusterHeight = this.options.maxRowClusterWidth;
    this.scaleType = this.getScaleType();

    this.addMetadataTrigger = null;
    this.columnMetadataSortField = null;
    this.columnMetadataSortAsc = true;
  }

  getScaleType() {
    return this.options.scale === "symlog" ? symlog : d3.scale.linear;
  }

  start() {
    this.processData();
  }

  processData(start) {
    // This function implements the pipeline for preparing data
    // and svg for heatmap display.
    // Starting point can be chosen given what data was changed.
    if (!start) start = "setupContainers";

    switch (start) {
      case "setupContainers":
        this.setupContainers();
      // falls through
      case "parse":
        this.parseData();
      // falls through
      case "filter":
        this.filterData();
      // falls through
      case "processMetadata":
        this.processMetadata();
      // falls through
      case "cluster":
        this.cluster();
      // falls through
      case "placeContainers":
        this.placeContainers();
      // falls through
      case "update":
        this.update();
        break;
      default:
        break;
    }
  }

  updateScale(scale) {
    this.options.scale = scale;
    this.scaleType = this.getScaleType();
    this.processData("cluster");
  }

  updateColumnMetadata(metadata) {
    this.options.columnMetadata = metadata;
    this.processData("processMetadata");
  }

  parseData() {
    this.rowLabels = this.data.rowLabels.map((row, pos) => {
      return Object.assign({ pos, shaded: false }, row);
    });
    this.columnLabels = this.data.columnLabels.map((column, pos) => {
      return Object.assign({ pos, shaded: false }, column);
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
      min: Math.min(
        d3.min(this.data.values, array => d3.min(array)),
        this.options.nullValue
      ),
      max: Math.max(
        d3.max(this.data.values, array => d3.max(array)),
        this.options.nullValue
      )
    };

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
  }

  filterData() {
    this.filteredCells = this.cells.filter(
      cell => !this.rowLabels[cell.rowIndex].hidden
    );
    this.filteredRowLabels = this.rowLabels.filter(row => !row.hidden);
  }

  setupContainers() {
    this.svg = this.container
      .append("svg")
      .attr("class", cs.heatmap)
      .attr("id", "visualization")
      .attr("xmlns", "http://www.w3.org/2000/svg");

    this.g = this.svg.append("g");
    this.gRowLabels = this.g.append("g").attr("class", cs.rowLabels);
    this.gColumnLabels = this.g.append("g").attr("class", cs.columnLabels);
    this.gCells = this.g.append("g").attr("class", cs.cells);
    this.gRowDendogram = this.g
      .append("g")
      .attr("class", cx(cs.dendogram, "rowDendogram"));
    this.gColumnDendogram = this.g
      .append("g")
      .attr("class", cx(cs.dendogram, "columnDendogram"));
    this.gColumnMetadata = this.g.append("g").attr("class", cs.columnMetadata);
  }

  placeContainers() {
    this.rowClusterWidth = Math.min(
      this.getDepth(this.rowClustering) * this.options.defaultClusterStep +
        this.options.spacing,
      this.options.maxRowClusterWidth
    );
    this.columnClusterHeight = Math.min(
      this.getDepth(this.columnClustering) * this.options.defaultClusterStep +
        this.options.spacing,
      this.options.maxColumnClusterHeight
    );

    this.cell = {
      width: Math.max(
        (this.options.minWidth - this.rowLabelsWidth - this.rowClusterWidth) /
          this.columnLabels.length,
        this.options.minCellWidth
      ),
      height: Math.max(
        (this.options.minHeight -
          this.columnLabelsHeight -
          this.columnClusterHeight) /
          this.rowLabels.length,
        this.options.minCellHeight
      )
    };

    this.width =
      this.cell.width * this.columnLabels.length +
      this.options.marginLeft +
      this.options.marginRight +
      this.rowLabelsWidth +
      (this.options.clustering ? this.rowClusterWidth : 0);
    this.height =
      this.cell.height * this.filteredRowLabels.length +
      this.options.marginTop +
      this.options.marginBottom +
      this.columnLabelsHeight +
      (this.options.clustering ? this.columnClusterHeight : 0) +
      this.options.columnMetadata.length * this.options.minCellHeight +
      this.options.spacing;

    this.svg.attr("width", this.width).attr("height", this.height);

    this.g.attr(
      "transform",
      `translate(${this.options.marginLeft},${this.options.marginTop})`
    );

    this.gRowLabels.attr(
      "transform",
      `translate(0, ${this.columnLabelsHeight +
        this.options.minCellHeight * this.options.columnMetadata.length +
        this.options.spacing})`
    );
    this.gColumnLabels.attr(
      "transform",
      `translate(${this.rowLabelsWidth},${this.columnLabelsHeight})`
    );
    this.gCells.attr(
      "transform",
      `translate(${this.rowLabelsWidth},${this.columnLabelsHeight +
        this.options.minCellHeight * this.options.columnMetadata.length +
        this.options.spacing})`
    );
    this.gRowDendogram.attr(
      "transform",
      `translate(${this.rowLabelsWidth +
        this.cell.width * this.columnLabels.length},${this.columnLabelsHeight +
        this.options.minCellHeight * this.options.columnMetadata.length +
        this.options.spacing})`
    );
    this.gColumnDendogram.attr(
      "transform",
      `translate(${this.rowLabelsWidth},${this.columnLabelsHeight +
        this.cell.height * this.filteredRowLabels.length +
        this.options.minCellHeight * this.options.columnMetadata.length +
        this.options.spacing})`
    );
    this.gColumnMetadata.attr(
      "transform",
      `translate(0, ${this.columnLabelsHeight})`
    );
  }

  processMetadata() {
    // count number of distinct pieces of metadata
    let metadatumCount = 0;
    this.options.columnMetadata.forEach(metadata => {
      let metadataSet = new Set();
      this.columnLabels.forEach(column => {
        let metadatumValue = (column.metadata || {})[metadata.value];
        if (metadatumValue) metadataSet.add(metadatumValue);
      });
      metadatumCount += metadataSet.size;
    });

    let colors = this.options.metadataColorScale.getNScale(metadatumCount);
    let idx = 0;
    this.metadataColors = {};
    this.options.columnMetadata.forEach(metadata => {
      let colorMap = {};

      this.columnLabels.forEach(column => {
        let metadatumValue = (column.metadata || {})[metadata.value];
        if (metadatumValue && !colorMap[metadatumValue])
          colorMap[metadatumValue] = colors[idx++];
      });
      this.metadataColors[metadata.value] = colorMap;
    });
  }

  cluster() {
    if (this.options.clustering) {
      this.clusterRows();

      if (!this.columnMetadataSortField) this.clusterColumns();
    }
  }

  update() {
    this.renderHeatmap();
    this.renderRowLabels();
    this.renderColumnLabels();
    this.renderColumnMetadata();

    if (this.options.clustering) {
      this.renderRowDendrogram();
      this.renderColumnDendrogram();
    }

    this.options.onUpdateFinished && this.options.onUpdateFinished();
  }

  getScale() {
    return this.scaleType()
      .domain([this.limits.min, this.limits.max])
      .range([0, 1]);
  }

  getRows() {
    let scale = this.getScale();
    // getRows and getColumns replace null with option.nullValue
    // might be space-inneficient if the matrix is too sparse
    // alternative is to create a distance function that supports nulls
    let rows = [];
    for (let i = 0; i < this.data.values.length; i++) {
      if (!this.rowLabels[i].hidden) {
        let row = this.data.values[i].slice();
        for (let j = 0; j < this.columnLabels.length; j++) {
          row[j] = scale(row[j] || this.options.nullValue);
        }
        row.idx = i;
        rows.push(row);
      }
    }
    return rows;
  }

  getColumns() {
    let scale = this.getScale();
    let columns = [];
    for (let i = 0; i < this.columnLabels.length; i++) {
      for (let j = 0; j < this.rowLabels.length; j++) {
        if (!this.rowLabels[j].hidden) {
          if (!columns[i]) {
            columns[i] = [];
            columns[i].idx = i;
          }
          columns[i].push(
            scale(this.data.values[j][i] || this.options.nullValue)
          );
        }
      }
    }
    return columns;
  }

  sortTree(root) {
    if (!root) return;
    let scale = this.getScale();
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
          root.mean = mean(root.value.map(d => scale(d)));
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

  getDepth(root) {
    if (!root) return 0;
    let stack = [[root, 0]];
    let maxDepth = 0;
    while (stack.length) {
      let [node, depth] = stack.pop();
      maxDepth = depth > maxDepth ? depth : maxDepth;
      if (node.left) stack.push([node.left, depth + 1]);
      if (node.right) stack.push([node.right, depth + 1]);
    }

    return maxDepth;
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

  download(filename) {
    this.svgSaver.asSvg(this.svg.node(), filename || "heatmap.svg");
  }

  removeRow = row => {
    this.options.onRemoveRow && this.options.onRemoveRow(row.label);
    delete row.pos;
    row.hidden = true;
    this.processData("filter");
  };

  handleColumnMetadataLabelClick(value) {
    if (this.columnMetadataSortField === value) {
      if (this.columnMetadataSortAsc) {
        this.columnMetadataSortAsc = false;
      } else {
        this.columnMetadataSortField = null;
        this.columnMetadataSortAsc = true;
      }
    } else {
      this.columnMetadataSortField = value;
      this.columnMetadataSortAsc = true;
    }

    if (this.columnMetadataSortField) {
      this.columnClustering = null;
      orderBy(
        this.columnLabels,
        label => {
          return (label.metadata && label.metadata[value]) || "ZZZ";
        },
        this.columnMetadataSortAsc ? "asc" : "desc"
      ).forEach((label, idx) => {
        label.pos = idx;
      });
    }
    this.processData("cluster");
  }

  renderHeatmap() {
    let applyFormat = nodes => {
      nodes
        .attr("width", this.cell.width - 2)
        .attr("height", this.cell.height - 2)
        .attr(
          "x",
          d => this.columnLabels[d.columnIndex].pos * this.cell.width + 1
        )
        .attr("y", d => this.rowLabels[d.rowIndex].pos * this.cell.height + 1)
        .style("fill", d => {
          if (!d.value && d.value !== 0) {
            return this.options.colorNoValue;
          }
          let colorIndex = Math.round(colorScale(d.value));
          return this.options.colors[colorIndex];
        });
    };

    let colorScale = this.scaleType()
      .domain([this.limits.min, this.limits.max])
      .range([0, this.options.colors.length - 1]);

    let cells = this.gCells
      .selectAll(`.${cs.cell}`)
      .data(this.filteredCells, d => d.id);

    cells
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    let cellsUpdate = cells
      .transition()
      .duration(this.options.transitionDuration);
    applyFormat(cellsUpdate);

    let cellsEnter = cells
      .enter()
      .append("rect")
      .attr("class", d =>
        cx(cs.cell, `cellColumn_${d.columnIndex}`, `cellRow_${d.rowIndex}`)
      )
      .on("mouseover", d => {
        this.rowLabels[d.rowIndex].highlighted = true;
        this.columnLabels[d.columnIndex].highlighted = true;
        this.updateLabelHighlights(
          this.gRowLabels.selectAll(`.${cs.rowLabel}`),
          this.rowLabels
        );
        this.updateLabelHighlights(
          this.gColumnLabels.selectAll(`.${cs.columnLabel}`),
          this.columnLabels
        );

        this.options.onNodeHover && this.options.onNodeHover(d);
      })
      .on("mouseleave", d => {
        this.rowLabels[d.rowIndex].highlighted = false;
        this.columnLabels[d.columnIndex].highlighted = false;
        this.updateLabelHighlights(
          this.gRowLabels.selectAll(`.${cs.rowLabel}`),
          this.rowLabels
        );
        this.updateLabelHighlights(
          this.gColumnLabels.selectAll(`.${cs.columnLabel}`),
          this.columnLabels
        );

        this.options.onNodeHoverOut && this.options.onNodeHoverOut(d);
      })
      .on("mousemove", d => {
        this.options.onNodeHoverMove &&
          this.options.onNodeHoverMove(d, d3.event);
      })
      .on(
        "click",
        d => this.options.onCellClick && this.options.onCellClick(d, d3.event)
      );
    applyFormat(cellsEnter);
  }

  renderRowLabels() {
    let applyFormat = nodes => {
      nodes.attr("transform", d => `translate(0, ${d.pos * this.cell.height})`);
    };

    let rowLabel = this.gRowLabels
      .selectAll(`.${cs.rowLabel}`)
      .data(this.filteredRowLabels, d => d.label);

    rowLabel
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    let rowLabelUpdate = rowLabel
      .transition()
      .duration(this.options.transitionDuration);
    applyFormat(rowLabelUpdate);

    let rowLabelEnter = rowLabel
      .enter()
      .append("g")
      .attr("class", cs.rowLabel)
      .on("mousein", this.options.onRowLabelMouseIn)
      .on("mouseout", this.options.onRowLabelMouseOut);

    rowLabelEnter
      .append("rect")
      .attr("class", cs.hoverTarget)
      .attr("width", this.rowLabelsWidth)
      .attr("height", this.cell.height)
      .style("text-anchor", "end");

    rowLabelEnter
      .append("text")
      .text(d => d.label)
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth - this.options.spacing}, ${this.cell
          .height / 2})`
      )
      .style("dominant-baseline", "central")
      .style("text-anchor", "end")
      .on(
        "click",
        d =>
          this.options.onRowLabelClick &&
          this.options.onRowLabelClick(d.label, d3.event)
      );

    rowLabelEnter
      .append("text")
      .attr("class", cs.removeIcon)
      .text("X")
      .attr("transform", `translate(0, ${this.cell.height / 2})`)
      .style("dominant-baseline", "central")
      .on("click", this.removeRow);

    applyFormat(rowLabelEnter);
  }

  renderColumnLabels() {
    let applyFormat = nodes => {
      nodes.attr("transform", d => {
        return `translate(${d.pos * this.cell.width},-${this.options.spacing})`;
      });
    };

    let columnLabel = this.gColumnLabels
      .selectAll(`.${cs.columnLabel}`)
      .data(this.columnLabels, d => d.label);

    let columnLabelUpdate = columnLabel
      .transition()
      .duration(this.options.transitionDuration);
    applyFormat(columnLabelUpdate);

    let columnLabelEnter = columnLabel
      .enter()
      .append("g")
      .attr("class", cs.columnLabel);

    columnLabelEnter
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
      .on(
        "click",
        d =>
          this.options.onColumnLabelClick &&
          this.options.onColumnLabelClick(d.label, d3.event)
      );

    applyFormat(columnLabelEnter);
  }

  renderColumnMetadata() {
    this.renderColumnMetadataLabels();
    this.renderColumnMetadataCells();
    this.renderColumnMetadataAddLink();
  }

  renderColumnMetadataLabels() {
    let iconSize = 16;

    let applyFormat = nodes => {
      nodes.attr("transform", (d, idx) => {
        const xOffset =
          d.value === this.columnMetadataSortField
            ? -iconSize - this.options.spacing
            : 0;
        return `translate(${xOffset}, ${idx * this.options.minCellHeight})`;
      });
    };

    let columnMetadataLabel = this.gColumnMetadata
      .selectAll(`.${cs.columnMetadataLabel}`)
      .data(this.options.columnMetadata, d => d.value);

    columnMetadataLabel
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    let columnMetadataLabelUpdate = columnMetadataLabel
      .transition()
      .duration(this.options.transitionDuration);

    columnMetadataLabelUpdate
      .select(".metadataSortIcon")
      .attr(
        "xlink:href",
        d =>
          d.value === this.columnMetadataSortField
            ? `${this.options.iconPath}/sort_${
                this.columnMetadataSortAsc ? "asc" : "desc"
              }.svg`
            : ""
      );

    applyFormat(columnMetadataLabelUpdate);

    let columnMetadataLabelEnter = columnMetadataLabel
      .enter()
      .append("g")
      .attr("class", cs.columnMetadataLabel)
      .on("mousein", this.options.onColumnMetadataLabelMouseIn)
      .on("mouseout", this.options.onColumnMetadataLabelMouseOut);

    columnMetadataLabelEnter
      .append("rect")
      .attr("class", cs.hoverTarget)
      .attr("width", this.rowLabelsWidth)
      .attr("height", this.options.minCellHeight)
      .style("text-anchor", "end");

    columnMetadataLabelEnter
      .append("text")
      .text(d => d.label)
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth - this.options.spacing}, ${this.options
          .minCellHeight / 2})`
      )
      .style("dominant-baseline", "central")
      .style("text-anchor", "end")
      .on("click", d => {
        this.options.onColumnMetadataLabelClick
          ? this.options.onColumnMetadataLabelClick(d.value, d3.event)
          : this.handleColumnMetadataLabelClick(d.value);
      })
      .on("mouseover", d => {
        this.options.onColumnMetadataLabelHover &&
          this.options.onColumnMetadataLabelHover(d);
      })
      .on("mouseleave", d => {
        this.options.onColumnMetadataLabelOut &&
          this.options.onColumnMetadataLabelOut(d);
      })
      .on("mousemove", d => {
        this.options.onColumnMetadataLabelMove &&
          this.options.onColumnMetadataLabelMove(d, d3.event);
      });

    columnMetadataLabelEnter
      .append("g")
      .attr(
        "transform",
        `translate(${this.rowLabelsWidth},${(this.options.minCellHeight +
          iconSize) /
          2})`
      )
      .append("svg:image")
      .attr("class", "metadataSortIcon")
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("transform", "rotate(-90)");

    applyFormat(columnMetadataLabelEnter);
  }

  renderColumnMetadataCells() {
    let applyFormatForCells = nodes => {
      nodes
        .attr("width", this.cell.width - 2)
        .attr("height", this.options.minCellHeight - 2)
        .attr(
          "transform",
          d =>
            `translate(${d.pos * this.cell.width + this.rowLabelsWidth + 1}, 0)`
        );
    };

    let applyFormatForRows = nodes => {
      nodes.attr(
        "transform",
        (_, i) => `translate(0, ${this.options.minCellHeight * i})`
      );
    };

    let columnnMetadataCells = this.gColumnMetadata
      .selectAll(".columnMetadataCells")
      .data(this.options.columnMetadata, d => d.value);

    columnnMetadataCells
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    let rowsUpdate = columnnMetadataCells
      .transition()
      .duration(this.options.transitionDuration);
    applyFormatForRows(rowsUpdate);

    let rowsEnter = columnnMetadataCells
      .enter()
      .append("g")
      .attr("class", d => cx("columnMetadataCells", d.value));
    applyFormatForRows(rowsEnter);

    this.options.columnMetadata.forEach(metadata => {
      let columnMetadataCell = this.gColumnMetadata
        .select(`.columnMetadataCells.${metadata.value}`)
        .selectAll(".columnMetadataCell")
        .data(this.columnLabels, d => d.label);

      columnMetadataCell
        .exit()
        .lower()
        .transition()
        .duration(this.options.transitionDuration)
        .style("opacity", 0)
        .remove();

      let columnMetadataCellUpdate = columnMetadataCell
        .transition()
        .duration(this.options.transitionDuration);
      applyFormatForCells(columnMetadataCellUpdate);

      let columnMetadataCellEnter = columnMetadataCell
        .enter()
        .append("rect")
        .attr("class", "columnMetadataCell")
        .style("fill", d => {
          let metadataValue = d.metadata[metadata.value];
          return metadataValue
            ? this.metadataColors[metadata.value][metadataValue]
            : this.options.colorNoValue;
        });
      applyFormatForCells(columnMetadataCellEnter);
    });
  }

  renderColumnMetadataAddLink() {
    if (this.options.onAddColumnMetadataClick) {
      let addLink = this.gColumnMetadata
        .selectAll(`.${cs.columnMetadataAdd}`)
        .data([1]);

      let addLinkEnter = addLink
        .enter()
        .append("g")
        .attr("class", cs.columnMetadataAdd);

      let yPos = this.options.spacing / 2;

      addLinkEnter.append("rect");

      addLinkEnter.append("line").attr("class", cs.metadataAddLine);

      let addMetadataTrigger = addLinkEnter
        .append("g")
        .attr("class", cs.metadataAddTrigger)
        .on("click", () => {
          this.options.onAddColumnMetadataClick(addMetadataTrigger.node(), {
            x: this.rowLabelsWidth - 10,
            y: yPos
          });
        });

      addMetadataTrigger
        .append("svg:image")
        .attr("class", cs.metadataAddIcon)
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", this.rowLabelsWidth - 15)
        .attr("y", yPos - 5)
        .attr("xlink:href", `${this.options.iconPath}/edit.svg`);

      // setup triggers
      if (addMetadataTrigger.size())
        this.addMetadataTrigger = addMetadataTrigger.node();

      // update
      addLink.attr(
        "transform",
        `translate(0, ${this.options.columnMetadata.length *
          this.options.minCellHeight})`
      );

      addLink
        .select("rect")
        .attr(
          "width",
          this.rowLabelsWidth + this.columnLabels.length * this.cell.width
        )
        .attr("height", this.options.spacing);

      addLink
        .select(`.${cs.metadataAddLine}`)
        .attr("x1", this.rowLabelsWidth)
        .attr(
          "x2",
          this.rowLabelsWidth + this.columnLabels.length * this.cell.width
        )
        .attr("y1", yPos)
        .attr("y2", yPos);
    }
  }

  // Dendograms
  renderColumnDendrogram() {
    this.gColumnDendogram.select("g").remove();
    let container = this.gColumnDendogram.append("g");
    if (this.columnClustering) {
      let width = this.cell.width * this.columnLabels.length;
      let height = this.columnClusterHeight - this.options.spacing;

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
  }

  renderRowDendrogram() {
    let height = this.rowClusterWidth - 10;
    let width = this.cell.height * this.filteredRowLabels.length;

    this.gRowDendogram.select("g").remove();
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
      `scale(-1,1) translate(-${this.rowClusterWidth},0)`
    );
  }

  updateCellHighlights() {
    this.gCells
      .selectAll(`.${cs.cell}`)
      .data(this.cells, d => d.id)
      .classed(
        cs.shaded,
        d =>
          this.columnLabels[d.columnIndex].shaded ||
          this.rowLabels[d.rowIndex].shaded
      );
  }

  updateLabelHighlights(nodes, labels) {
    nodes
      .data(labels, d => d.label)
      .classed(cs.highlighted, d => d.highlighted);
  }

  renderDendrogram(container, tree, targets, width, height) {
    let cluster = d3.layout
      .cluster()
      .size([width, height])
      .separation(function() {
        return 1;
      });

    let diagonal = (d, useRectEdges) => {
      if (useRectEdges === true)
        return `M${d.source.y},${d.source.x}V${d.target.x}H${d.target.y}`;

      let radius = 4;
      let dir = (d.source.x - d.target.x) / Math.abs(d.source.x - d.target.x);
      return `M${d.source.y},${d.source.x}
                L${d.source.y},${d.target.x + dir * radius}
                A${radius} ${radius} 0, 0, ${(dir + 1) / 2}, ${d.source.y +
        radius} ${d.target.x}
                L${d.target.y},${d.target.x}`;
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
        .selectAll(`.${cs.link}`)
        .data(cluster.links(nodes))
        .classed(cs.highlighted, d => d.source.highlighted);

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
      .selectAll(`.${cs.link}`)
      .data(cluster.links(nodes))
      .enter()
      .append("g")
      .attr("class", cs.link);

    links
      .append("path")
      .attr("class", cs.linkPath)
      .attr("d", diagonal);

    links
      .append("rect")
      .attr("class", cs.hoverTarget)
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

  getAddMetadataTriggerRef() {
    return this.addMetadataTrigger;
  }

  getColumnMetadataLegend(value) {
    if (
      some(
        this.columnLabels,
        label => !label.metadata || !label.metadata[value]
      )
    ) {
      return Object.assign({}, this.metadataColors[value], {
        Unknown: this.options.colorNoValue
      });
    } else {
      return this.metadataColors[value];
    }
  }
}
