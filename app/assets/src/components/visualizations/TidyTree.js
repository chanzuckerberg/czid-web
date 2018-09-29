import { stratify, tree as d3Tree, hierarchy } from "d3-hierarchy";
import { select, event as currentEvent } from "d3-selection";
import { scaleLinear } from "d3-scale";

export default class TidyTree {
  constructor(container, nodes, options) {
    this.container = container;
    this.svg = null;
    this.pathContainer = null;
    this.nodeContainer = null;

    this.options = Object.assign(
      {
        leafNodeHeight: 35,
        minWidth: 1000,
        minHeight: 300,
        useCommonName: false,
        transitionDuration: 500,
        attribute: "aggregatescore",
        onNodeHover: null,
        onCreatedTree: null,
        tooltipContainer: null,
        collapseThreshold: 0.4
      },
      options || {}
    );

    this.margins = {
      top: 20,
      right: 200,
      left: 40,
      bottom: 20
    };

    this.range = [0, 1];

    this.setTree(nodes);
  }

  initialize() {
    this.svg = select(this.container)
      .append("svg")
      .attr("class", "tidy-tree")
      .attr("width", this.options.width)
      .attr("height", this.options.height);

    this.pathContainer = this.svg
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margins.left + "," + this.margins.top + ")"
      );

    this.nodeContainer = this.svg
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margins.left + "," + this.margins.top + ")"
      );

    this.tooltipContainer = select(this.options.tooltipContainer);
  }

  setOptions(options) {
    console.log("set options", options);
    Object.assign(this.options, options);

    if (options.attribute) {
      this.sortAndScaleTree();
    }

    this.update();
  }

  setTree(nodes) {
    let stratifier = stratify()
      .id(node => node.id)
      .parentId(node => node.parentId);

    this.root = stratifier(nodes);
    this.options.onCreatedTree && this.options.onCreatedTree(this.root);
    this.sortAndScaleTree();
  }

  sortAndScaleTree() {
    this.root.sort(
      (a, b) =>
        b.data.values[this.options.attribute] -
        a.data.values[this.options.attribute]
    );
    // .sum(node => (node.values || {})[this.options.attribute] || 0)

    this.range = [
      Math.min(
        ...this.root.leaves().map(l => l.data.values[this.options.attribute])
      ),
      this.root.data.values[this.options.attribute]
    ];

    let collapsedScale = scaleLinear()
      .domain(this.range)
      .range([0, 1]);
    this.root.each(d => {
      if (
        collapsedScale(d.data.values[this.options.attribute]) <
        this.options.collapseThreshold
      ) {
        d.collapsedChildren = d.children;
        d.children = null;
      }
    });
  }

  toggleCollapseNode(node) {
    var temp = node.children;
    node.children = node.collapsedChildren;
    node.collapsedChildren = temp;
    this.update(
      Object.assign(node, {
        x0: node.x,
        y0: node.y
      })
    );
  }

  curvedPath(source, target) {
    return `M ${source.y} ${source.x}
            C ${(source.y + target.y) / 2} ${source.x},
            ${(source.y + target.y) / 2} ${target.x},
            ${target.y} ${target.x}`;
  }

  update(source) {
    if (!this.svg) {
      this.initialize();
    }

    // adjust dimensions
    let width = this.options.minWidth;
    let height = Math.max(
      this.options.minHeight,
      this.options.leafNodeHeight * this.root.leaves().length
    );

    this.root.x0 = height / 2;
    this.root.y0 = 0;

    this.svg
      .transition()
      .duration(this.options.transitionDuration)
      .attr("width", width + this.margins.left + this.margins.right)
      .attr("height", height + this.margins.top + this.margins.bottom);

    // console.log(hierarchy(this.root, d => d.children));
    d3Tree().size([height, width])(this.root);

    source = source || this.root;

    // compute scales for nodes
    let nodeScale = scaleLinear()
      .domain(this.range)
      .range([2, 20]);
    let linkScale = scaleLinear()
      .domain(this.range)
      .range([1, 20]);
    let fontScale = scaleLinear()
      .domain(this.range)
      .range([8, 12]);

    let links = this.pathContainer
      .selectAll(".link")
      .data(this.root.links(), d => {
        return d.target.id;
      });

    // Enter - Links
    links
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", () => {
        let startPoint = { x: source.x0, y: source.y0 };
        return this.curvedPath(startPoint, startPoint);
      });

    // Update - Links
    let linksUpdate = this.pathContainer
      .selectAll("path")
      .transition()
      .duration(this.options.transitionDuration)
      .attr("d", d => this.curvedPath(d.source, d.target))
      .attr("stroke-width", d => {
        return linkScale(d.target.data.values[this.options.attribute]);
      });

    // Exit - Links
    links
      .exit()
      .transition()
      .duration(this.options.transitionDuration)
      .attr("d", this.curvedPath(source, source))
      .remove();

    let nodes = this.nodeContainer
      .selectAll("g.node")
      .data(this.root.descendants(), d => d.id);

    // Enter - Nodes
    let nodesEnter = nodes
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", () => {
        let x = (source && source.x0) || this.root.x0;
        let y = (source && source.y0) || this.root.y0;
        return `translate(${y},${x})`;
      });

    let clickableNode = nodesEnter
      .append("g")
      .on("click", d => this.toggleCollapseNode(d));

    clickableNode.append("circle").attr("r", 0);

    clickableNode
      .filter(d => d.children || d.collapsedChildren)
      .append("path")
      .attr("class", "cross")
      .attr("d", "M0,0");

    nodesEnter
      .append("text")
      .attr(
        "dy",
        d =>
          d.children ? -4 - nodeScale(d.data.values[this.options.attribute]) : 0
      )
      .attr(
        "x",
        d =>
          d.children ? 0 : 4 + nodeScale(d.data.values[this.options.attribute])
      )
      .style("text-anchor", d => (d.children ? "middle" : "start"))
      .style("alignment-baseline", d => (d.children ? "baseline" : "middle"))
      .style("font-size", d => fontScale(d.data.values[this.options.attribute]))
      .style("fill-opacity", 0)
      .attr("class", d => {
        console.log(d, this.options.useCommonName, !d.data.commonName);
        return this.options.useCommonName && !d.data.commonName
          ? "name-missing"
          : null;
      })
      .text(
        d =>
          (this.options.useCommonName ? d.data.commonName : null) ||
          d.data.scientificName
      )
      .on("click", this.options.onNodeLabelClick);

    if (this.tooltipContainer) {
      nodesEnter
        .on("mouseover", node => {
          this.options.onNodeHover && this.options.onNodeHover(node);
          this.tooltipContainer.classed("visible", true);
        })
        .on("mousemove", node => {
          this.tooltipContainer
            .style("left", currentEvent.pageX + 20 + "px")
            .style("top", currentEvent.pageY + 20 + "px");
        })
        .on("mouseout", () => {
          this.tooltipContainer.classed("visible", false);
        });
    }

    // Update - Nodes
    let nodeUpdate = this.nodeContainer
      .selectAll("g.node")
      .transition()
      .duration(this.options.transitionDuration)
      .attr("class", d => {
        let classes =
          "node " +
          (d.children || d.collapsedChildren
            ? " node__internal"
            : " node__leaf") +
          (d.collapsedChildren ? "--collapsed" : "");
        return classes;
      })
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    nodeUpdate
      .selectAll("text")
      .attr("class", d => {
        return this.options.useCommonName && !d.data.commonName
          ? "name-missing"
          : null;
      })
      .text(
        d =>
          (this.options.useCommonName ? d.data.commonName : null) ||
          d.data.scientificName
      )
      .attr(
        "dy",
        d =>
          d.children ? -4 - nodeScale(d.data.values[this.options.attribute]) : 0
      )
      .attr(
        "x",
        d =>
          d.children ? 0 : 4 + nodeScale(d.data.values[this.options.attribute])
      )
      .style("text-anchor", d => (d.children ? "middle" : "start"))
      .style("alignment-baseline", d => (d.children ? "baseline" : "middle"))
      .style("fill-opacity", 1);

    nodeUpdate
      .select("circle")
      .attr("r", d => nodeScale(d.data.values[this.options.attribute]));

    nodeUpdate.select("path.cross").attr("d", d => {
      let r = nodeScale(d.data.values[this.options.attribute]) * 0.9;
      r = Math.min(r, 8);
      return `M${-r},0 L${r},0 M0,${-r} L0,${r}`;
    });

    // Exit - Nodes
    let nodesExit = nodes
      .exit()
      .transition()
      .duration(this.options.transitionDuration)
      .attr("transform", d => {
        return "translate(" + source.y + "," + source.x + ")";
        // return "translate(" + (source.y - this.margins.left) + "," + (source.x - this.margins.top) + ")";
      })
      .remove();

    nodesExit.select("circle").attr("r", 1e-6);
    nodesExit.select("text").style("fill-opacity", 1e-6);
  }
}

// TODO: scale links
// TODO: links transition -> thickness
