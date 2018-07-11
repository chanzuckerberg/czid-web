import d3 from "d3";
import ObjectHelper from "../../helpers/ObjectHelper";
import React from "react";
import PropTypes from "prop-types";
import textWidth from "text-width";

export default class Heatmap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.colors = this.props.colors;
    this.initializeData(this.props);
  }

  componentDidMount() {
    this.renderD3();
  }

  componentWillReceiveProps(nextProps) {
    if (ObjectHelper.shallowEquals(nextProps, this.props)) {
      return;
    }
    d3.select(".heatmap svg").remove();
    this.initializeData(nextProps);
    this.renderD3();
  }

  initializeData(props) {
    this.row_number = props.rows;
    this.col_number = props.columns;

    this.rowLabel = [];
    this.colLabel = [];

    let longest_row_label = 0,
      longest_col_label = 0;

    // Figure out column and row labels
    for (let i = 0; i < this.row_number; i += 1) {
      let label = props.getRowLabel(i);
      this.rowLabel.push(label);
      let row_width = textWidth(label, {
        size: "8pt"
      });

      longest_row_label = Math.max(longest_row_label, row_width);
    }

    for (let j = 0; j < this.col_number; j += 1) {
      let label = props.getColumnLabel(j);
      this.colLabel.push(label);
      let col_width = textWidth(label, {
        size: "8pt"
      });
      longest_col_label = Math.max(longest_col_label, col_width);
    }

    // Generate the grid data
    this.data = [];
    this.min = 999999999;
    this.max = -999999999;

    for (var i = 0; i < this.row_number; i += 1) {
      for (var j = 0; j < this.col_number; j += 1) {
        let value = props.getCellValue(i, j);
        this.data.push({
          row: i,
          col: j,
          value: value
        });
        if (value !== undefined) {
          this.min = Math.min(this.min, value);
          this.max = Math.max(this.max, value);
        }
      }
    }
    this.margin = {
      top: longest_col_label * Math.cos(25 * (Math.PI / 180)) + 15,
      left: Math.max(Math.ceil(Math.sqrt(this.row_number)) * 10, 40),
      bottom: 80,
      right: longest_row_label + 20
    };
    this.cellWidth = Math.max(900 / this.col_number, 20);
    this.cellHeight = Math.max(400 / this.row_number, 15);

    this.width =
      this.cellWidth * this.col_number + this.margin.left + this.margin.right;
    this.height =
      this.cellHeight * this.row_number + this.margin.top + this.margin.bottom;

    this.colTree = props.colTree;
    this.rowTree = props.rowTree;
    this.scale = props.scale;
    this.legendElementWidth = this.margin.right / this.colors.length;
  }

  renderD3() {
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.offsetCanvas = this.svg
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    this.renderRowLabels();
    this.renderColLabels();
    this.renderHeatmap();
    //this.renderLegend();
    this.renderColDendrogram();
    this.renderRowDendrogram();
  }

  renderHeatmap() {
    let colorScale = this.scale()
      .domain([this.min, this.max])
      .range([0, this.colors.length - 1]);

    let that = this;
    this.offsetCanvas
      .append("g")
      .attr("class", "g3")
      .selectAll(".cellg")
      .data(this.data, function(d) {
        return d.row + ":" + d.col;
      })
      .enter()
      .append("rect")
      .attr("x", function(d) {
        return d.col * that.cellWidth;
      })
      .attr("y", function(d) {
        return d.row * that.cellHeight;
      })
      .attr("class", function(d) {
        return "cell cell-border cr" + d.row + " cc" + d.col;
      })
      .attr("width", this.cellWidth)
      .attr("height", this.cellHeight)
      .style("fill", function(d) {
        if (d.value === undefined) {
          return "rgb(238, 241, 244)";
        }
        let colorIndex = colorScale(d.value);
        return that.colors[Math.round(colorIndex)];
      })
      .on("click", this.props.onCellClick)
      .on("mouseover", function(d) {
        //highlight text
        d3.select(this).classed("cell-hover", true);
        d3.selectAll(".rowLabel").classed("text-highlight", function(r, ri) {
          return ri == d.row;
        });
        d3.selectAll(".colLabel").classed("text-highlight", function(c, ci) {
          return ci == d.col;
        });

        d3
          .select(that.tooltip)
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY - 10 + "px");
        d3.select(that.tooltip).classed("hidden", false);
        that.setState({
          hoverRow: d.row,
          hoverColumn: d.col
        });
      })
      .on("mouseout", function() {
        d3.select(this).classed("cell-hover", false);
        d3.selectAll(".rowLabel").classed("text-highlight", false);
        d3.selectAll(".colLabel").classed("text-highlight", false);
        d3.select(that.tooltip).classed("hidden", true);
      });
  }

  renderColDendrogram() {
    let width = this.cellWidth * this.col_number,
      height = this.margin.bottom - 20;

    let top_offset = this.margin.top + this.cellHeight * this.row_number + 10;
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

    //var diagonal = d3.svg.diagonal()
    //		.projection(function(d) { return [d.y, d.x]; });

    //set up the visualisation:
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
    /*
            var node = vis.selectAll("g.node")
                    .data(nodes)
                .enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

            node.append("circle")
                .attr("r", 4.5);
        node.append("text")
        .attr("dy", 3)
        .attr("x", function(d) { return d.children ? -8 : 8; })
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
                    if (d.sample) {
                        return d.sample.name;
                    }
                });
        */
    return visContainer;
  }

  renderLegend() {
    let that = this,
      height = 20,
      x_offset = this.cellWidth * this.col_number;

    this.offsetCanvas
      .selectAll(".legend-text-min")
      .data([this.min])
      .enter()
      .append("text")
      .attr("x", x_offset)
      .attr("y", -33)
      .attr("class", "mono")
      .text(Math.round(this.min));

    this.offsetCanvas
      .selectAll(".legend-text-max")
      .data([this.max])
      .enter()
      .append("text")
      .attr("class", "mono")
      .attr("x", function() {
        return x_offset + that.legendElementWidth * that.colors.length;
      })
      .attr("y", -33)
      .text(Math.round(this.max))
      .style("text-anchor", "end");

    var legend = this.offsetCanvas
      .selectAll(".legend")
      .data(this.colors)
      .enter()
      .append("g")
      .attr("class", "legend");

    legend
      .append("rect")
      .attr("x", function(d, i) {
        return Math.floor(x_offset + that.legendElementWidth * i);
      })
      .attr("y", -10 - height)
      .attr("width", Math.ceil(this.legendElementWidth))
      .attr("height", height)
      .style("fill", function(d, i) {
        return that.colors[i];
      });

    this.offsetCanvas
      .append("rect")
      .attr("x", function(d, i) {
        return x_offset + that.legendElementWidth * i;
      })
      .attr("stroke", "#aaa")
      .attr("stroke-width", "0.25")
      .style("fill", "none")
      .attr("y", -10 - height)
      .attr("width", that.legendElementWidth * that.colors.length)
      .attr("height", height);
  }

  renderRowLabels() {
    let that = this;
    let rowLabels = this.offsetCanvas
      .append("g")
      .selectAll(".rowLabelg")
      .data(this.rowLabel)
      .enter();

    let groups = rowLabels
      .append("g")
      .attr("class", "rowLabelg")
      .attr(
        "transform",
        "translate(" + this.cellWidth * this.col_number + ", 0)"
      )
      .on("mouseover", function() {
        d3.select(this).classed("text-hover", true);
      })
      .on("mouseout", function() {
        d3.select(this).classed("text-hover", false);
      });

    groups
      .append("rect")
      .attr("y", function(d, i) {
        return i * that.cellHeight;
      })
      .attr("width", this.margin.right)
      .attr("height", this.cellHeight)
      .style("fill", "#fff");

    groups
      .append("text")
      .text(function(d) {
        return d;
      })
      .attr("y", function(d, i) {
        return i * that.cellHeight;
      })
      .attr("transform", "translate(8," + this.cellHeight / 1.5 + ")")
      .attr("class", function(d, i) {
        return "rowLabel mono r" + i;
      });

    groups
      .append("text")
      .attr("class", "removeLink mono")
      .text("x")
      .attr("y", function(d, i) {
        return i * that.cellHeight;
      })
      .attr(
        "transform",
        "translate(" + this.margin.right + "," + this.cellHeight / 1.5 + ")"
      )
      .style("text-anchor", "end")
      .on("click", d => {
        this.props.onRemoveRow(d);
      });
  }

  renderColLabels() {
    let that = this;
    this.offsetCanvas
      .append("g")
      .selectAll(".colLabelg")
      .data(this.colLabel)
      .enter()
      .append("g")
      .attr("transform", function(d, i) {
        return "translate(" + that.cellWidth * i + ",-6)";
      })
      .append("text")
      .text(function(d) {
        return d;
      })
      .attr("x", 0)
      .attr("y", 0)
      .style("text-anchor", "left")
      .attr(
        "transform",
        "translate(" + this.cellWidth / 2 + ",-6) rotate (-65)"
      )
      .attr("class", function(d, i) {
        return "colLabel mono c" + i;
      })
      .on("mouseover", function() {
        d3.select(this).classed("text-hover", true);
      })
      .on("mouseout", function() {
        d3.select(this).classed("text-hover", false);
      })
      .on("click", (d, i) => {
        this.props.onColumnLabelClick(d, i);
      });
  }

  renderTooltip() {
    if (this.state.hoverRow === undefined) {
      return;
    }

    return (
      <div
        className="heatmap-tooltip hidden"
        ref={tooltip => {
          this.tooltip = tooltip;
        }}
      >
        {this.props.getTooltip(this.state.hoverRow, this.state.hoverColumn)}
      </div>
    );
  }

  render() {
    return (
      <div className="heatmap">
        {this.renderTooltip()}
        <div
          ref={container => {
            this.container = container;
          }}
        />
      </div>
    );
  }
}

Heatmap.propTypes = {
  colors: PropTypes.array,
  getTooltip: PropTypes.func.isRequired,
  onCellClick: PropTypes.func.isRequired,
  onColumnLabelClick: PropTypes.func.isRequired,
  onRemoveRow: PropTypes.func.isRequired
};

Heatmap.defaultProps = {
  colors: [
    "#FFFFFF",
    "#F9F1F4",
    "#F3E4EA",
    "#EDD6E0",
    "#E7C9D6",
    "#E2BBCC",
    "#DCAEC2",
    "#D6A1B8",
    "#D093AE",
    "#CA86A4",
    "#C57899",
    "#BF6B8F",
    "#B95D85",
    "#B3507B",
    "#AD4371",
    "#A83567",
    "#A2285D",
    "#9C1A53",
    "#960D49",
    "#91003F"
  ]
};
