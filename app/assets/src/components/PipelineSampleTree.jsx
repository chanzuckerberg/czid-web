import React from "react";
import d3, { event as currentEvent } from "d3";
import Dropdown from "./ui/controls/dropdowns/Dropdown";
import numberWithCommas from "../helpers/strings";

class PipelineSampleTree extends React.PureComponent {
  constructor(props) {
    super(props);
    this._getTooltip = this.getTooltip.bind(this);
    this.dataTypes = ["NT.r", "NT.rpm", "NT.aggregatescore", "NR.r", "NR.rpm"];
    this.state = {
      dataType: this.dataTypes[0]
    };
    this._updateDataType = this.updateDataType.bind(this);
    this._nodeTextClicked = this.nodeTextClicked.bind(this);
  }

  makeTree() {
    let make_node = function(id, name, level) {
      let data = {};
      for (let dataType of this.dataTypes) {
        data[dataType] = 0;
      }
      return {
        name: name,
        level: level,
        children: [],
        data: data,
        weight: 0,
        id: id
      };
    };
    make_node = make_node.bind(this);

    let rows = this.props.taxons;
    let nodes_by_id = {};

    let root = make_node(-12345, "", "");
    let tree = root;

    let order = [
      "species",
      "genus",
      "family",
      "order",
      "class",
      "phylum",
      "kingdom",
      "superkingdom"
    ].reverse();

    let getValue = (row, key) => {
      key = key || this.state.dataType;
      let parts = key.split(".");
      return parseFloat(row[parts[0]][parts[1]]);
    };

    for (let row of rows) {
      if (row.tax_level != 1) {
        continue;
      }

      tree = root;

      let has_categorization =
        order.filter(function(level) {
          return row.lineage && row.lineage[level + "_taxid"] >= 0;
        }).length > 1;

      if (!row.lineage || !has_categorization) {
        row.lineage = {
          genus_taxid: -9,
          genus_name: "Uncategorized",
          species_taxid: row.tax_id,
          species_name: row.name
        };
      }
      for (let j = 0; j < order.length; j += 1) {
        let level = order[j],
          taxon_id = row.lineage[level + "_taxid"],
          name;

        if (this.props.nameType == "Common name") {
          name = row.lineage[level + "_common_name"];
        }

        if (!name) {
          name = row.lineage[level + "_name"];
        }

        if (!name) {
          continue;
        }

        if (!nodes_by_id[taxon_id]) {
          let node = make_node(taxon_id, name, level);
          tree.children.push(node);
          nodes_by_id[taxon_id] = node;
        }

        nodes_by_id[taxon_id].name = nodes_by_id[taxon_id].name || name;
        for (let dataType of this.dataTypes) {
          tree.data[dataType] += getValue(row, dataType);
        }
        tree.weight += getValue(row);
        tree = nodes_by_id[taxon_id];
      }
      for (let dataType of this.dataTypes) {
        tree.data[dataType] += getValue(row, dataType);
      }
      tree.weight += getValue(row);
    }
    return root;
  }

  getTooltip(node) {
    if (!node) {
      return null;
    }
    let data = [];
    for (let dataType of this.dataTypes) {
      let activeCls = "";
      if (this.state.dataType == dataType) {
        activeCls = "active";
      }
      data.push(
        <li key={dataType} className={`row ${activeCls}`}>
          <div className="label col s6">{dataType}:</div>
          <div className="value col s6">
            {numberWithCommas(Math.round(node.data[dataType]))}
          </div>
        </li>
      );
    }
    return (
      <div className="sample-tree-tooltip">
        <div className="title">{node.level}</div>
        <div className="name">{node.name}</div>

        <div className="title">Data</div>
        <div className="data">
          <ul>{data}</ul>
        </div>
      </div>
    );
  }

  updateDataType(e, d) {
    this.setState({ dataType: d.value });
  }

  nodeTextClicked(d) {
    this.props.onNodeTextClicked && this.props.onNodeTextClicked(d);
  }

  renderWeightDataTypeChooser() {
    let options = [];
    for (let dataType of this.dataTypes) {
      options.push({
        value: dataType,
        text: dataType
      });
    }

    return (
      <Dropdown
        className={"data-type-chooser"}
        options={options}
        onChange={this._updateDataType}
        value={this.state.dataType}
        label="Data Type:"
      />
    );
  }
  render() {
    let tree = this.makeTree();
    return (
      <div className="pipeline-tree">
        {this.renderWeightDataTypeChooser()}
        <TreeStructure
          tree={tree}
          getTooltip={this._getTooltip}
          onNodeTextClicked={this._nodeTextClicked}
        />
      </div>
    );
  }
}

class TreeStructure extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
    this.autoCollapsed = false;
    this.i = 0;
    this.duration = 0;
  }
  componentWillReceiveProps(nextProps) {
    this.duration = 0;
    this.autoCollapsed = false;
    this.update(nextProps, nextProps.tree);
  }
  componentDidMount() {
    this.create();
    this.update(this.props, this.props.tree);
  }
  create() {
    this.svg = d3.select(this.container).append("svg");
    this.pathContainer = this.svg.append("g");
    this.nodeContainer = this.svg.append("g");
  }
  update(props, source) {
    let leaf_count = 0;
    let to_visit = [props.tree];
    let min_weight = 999999999;
    let collapseScale = d3.scale
      .linear()
      .domain([0, props.tree.weight])
      .range([0, 10]);

    while (to_visit.length) {
      let node = to_visit.pop();
      min_weight = Math.min(min_weight, node.weight);
      if (
        !this.autoCollapsed &&
        collapseScale(node.weight) < 2 &&
        node.children &&
        node.children.length
      ) {
        node._children = node.children;
        node.children = null;
      }
      if (!(node.children && node.children.length)) {
        leaf_count += 1;
      } else {
        to_visit = to_visit.concat(node.children);
      }
    }
    let circleScale = d3.scale
      .linear()
      .domain([min_weight, props.tree.weight])
      .range([2, 20]);

    let linkScale = d3.scale
      .linear()
      .domain([min_weight, props.tree.weight])
      .range([1, 20]);

    this.autoCollapsed = true;
    let width = 1000,
      height = Math.max(300, 25 * leaf_count);

    let margin = {
      top: 20,
      right: 200,
      left: 40,
      bottom: 20
    };

    props.tree.x0 = height / 2;
    props.tree.y0 = 0;

    this.svg
      .transition()
      .duration(this.duration)
      .attr(
        "width",
        Math.max(this.svg.attr("width"), width + margin.left + margin.right)
      )
      .attr(
        "height",
        Math.max(this.svg.attr("height"), height + margin.top + margin.bottom)
      );

    this.pathContainer.attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")"
    );
    this.nodeContainer.attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")"
    );

    let tree = d3.layout.tree().size([height, width]);
    let nodes = tree.nodes(props.tree);
    let links = tree.links(nodes);

    let diagonal = d3.svg.diagonal().projection(function(d) {
      return [d.y, d.x];
    });

    var node = this.nodeContainer.selectAll("g.node").data(nodes, d => {
      return d.id || (d.id = ++this.i);
    });

    let paths = this.pathContainer
      .selectAll("path.link")
      .data(links, function(d) {
        return d.target.id;
      });

    let pathsEnter = paths
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      })
      .attr("stroke-width", d => {
        return linkScale(d.target.weight);
      });

    let pathsExit = paths
      .exit()
      .transition()
      .duration(this.duration)
      .attr("d", function(d) {
        let o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      })
      .remove();

    let pathsUpdate = paths
      .transition()
      .duration(this.duration)
      .attr("d", d => {
        var source = {
          x: d.source.x - linkScale(this.calculateLinkSourcePosition(d)),
          y: d.source.y
        };
        var target = { x: d.target.x, y: d.target.y };
        return diagonal({ source: source, target: target });
      })
      .attr("stroke-width", function(d) {
        return linkScale(d.target.weight);
      });

    let nodeEnter = node
      .enter()
      .append("g")
      .attr("class", d => {
        let cls = "node";
        if (d._children) {
          cls += " collapsed";
        }
        return cls;
      })
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("mouseover", d => {
        this.setState({ hoverNode: d });

        d3
          .select(this.tooltip)
          .style("left", currentEvent.pageX + 10 + "px")
          .style("top", currentEvent.pageY - 10 + "px");
        d3.select(this.tooltip).classed("hidden", false);
      })
      .on("mouseout", d => {
        d3.select(this.tooltip).classed("hidden", true);
      });

    nodeEnter
      .append("circle")
      .attr("r", 1e-6)
      .on("click", d => {
        let t = d.children;
        d.children = d._children;
        d._children = t;
        this.update(this.props, d);
      });

    nodeEnter
      .append("text")
      .attr("dy", 3)
      .attr("x", function(d) {
        return d.children || d._children
          ? -1 * circleScale(d.weight) - 5
          : circleScale(d.weight) + 5;
      })
      .style("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) {
        return d.name;
      })
      .on("click", (d, e) => {
        this.props.onNodeTextClicked && this.props.onNodeTextClicked(d);
      })
      .style("fill-opacity", 1e-6);

    let nodeExit = node
      .exit()
      .transition()
      .duration(this.duration)
      .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select("circle").attr("r", 1e-6);

    nodeExit.select("text").style("fill-opacity", 1e-6);

    let nodeUpdate = node
      .transition()
      .duration(this.duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      })
      .attr("class", d => {
        let cls = "node";
        if (d._children) {
          cls += " collapsed";
        }
        return cls;
      });

    nodeUpdate.select("circle").attr("r", function(d) {
      return circleScale(d.weight);
    });

    nodeUpdate.select("text").style("fill-opacity", 1);

    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    this.duration = 750;
  }

  calculateLinkSourcePosition(link) {
    let targetID = link.target.id;
    let childrenNumber = link.source.children.length;
    let widthAbove = 0;
    for (var i = 0; i < childrenNumber; i++) {
      if (link.source.children[i].id == targetID) {
        // we are done
        widthAbove = widthAbove + link.source.children[i].weight / 2;
        break;
      } else {
        // keep adding
        widthAbove = widthAbove + link.source.children[i].weight;
      }
    }
    return link.source.weight / 2 - widthAbove;
  }

  renderTooltip() {
    if (this.state.hoverNode === undefined) {
      return;
    }

    return (
      <div
        className="d3-tree-tooltip hidden"
        ref={tooltip => {
          this.tooltip = tooltip;
        }}
      >
        {this.props.getTooltip(this.state.hoverNode)}
      </div>
    );
  }

  render() {
    return (
      <div className="d3-tree">
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

export default PipelineSampleTree;
