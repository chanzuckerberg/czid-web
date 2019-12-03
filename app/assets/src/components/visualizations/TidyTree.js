import { stratify, tree as d3Tree } from "d3-hierarchy";
import { select, event as currentEvent } from "d3-selection";
import { scaleLinear } from "d3-scale";

export default class TidyTree {
  constructor(container, nodes, options) {
    this.container = select(container);
    this.svg = null;
    this.pathContainer = null;
    this.nodeContainer = null;

    this.options = Object.assign(
      {
        addOverlays: true,
        attribute: "aggregatescore",
        leafNodeHeight: 35,
        minWidth: 960,
        minHeight: 300,
        transitionDuration: 500,
        onNodeHover: null,
        onCreatedTree: null,
        tooltipContainer: null,
        collapseThreshold: 0.4,
        useCommonName: false,
        minNonCollapsableChildren: 2,
        smallerFont: 8,
        largerFont: 12,
        onCollapsedStateChange: () => {},
        collapsed: new Set(),
        svgBackgroundColor: "white",
      },
      options || {}
    );

    this.margins = {
      top: 20,
      right: 200,
      left: 40,
      bottom: 20,
    };

    this.range = [0, 1];

    this.setTree(nodes);
  }

  initialize() {
    this.svg = this.container
      .append("svg")
      .attr("class", "tidy-tree")
      .attr("width", this.options.width)
      .attr("height", this.options.height)
      .attr(
        "style",
        // Not standard but it works for downloads and svgsaver. See
        // https://stackoverflow.com/questions/11293026/default-background-color-of-svg-root-element
        `background-color: ${this.options.svgBackgroundColor}`
      );

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
    Object.assign(this.options, options);

    if (options.attribute || options.collapseThreshold) {
      this.sortAndScaleTree();
    }

    this.update();
  }

  setTree(nodes) {
    console.log("nodes", nodes);
    let stratifier = stratify()
      .id(node => node.id)
      .parentId(node => node.parentId);

    // const a = nodes.filter(node => node.id === "_" || node.parentId === "_");
    // a.forEach(node => {
    //   if (node.parentId === a[0].id) {
    //     console.log("vvv HERE vvv");
    //     console.log("vvv HERE vvv");
    //     console.log("vvv HERE vvv");
    //   }
    //   console.log(`id=${node.id}   parent=${node.parentId}`);
    //   if (node.parentId === a[0].id) {
    //     console.log("^^^ HERE ^^^");
    //     console.log("^^^ HERE ^^^");
    //     console.log("^^^ HERE ^^^");
    //   }
    // })
    this.root = stratifier(nodes);
    console.log(this.root);
    this.options.onCreatedTree && this.options.onCreatedTree(this.root);
    this.sortAndScaleTree();

    this.update();
  }

  resetTree() {
    this.root.eachBefore(d => {
      if (d.children || d.collapsedChildren || d.hiddenChildren) {
        d.children = (d.children || [])
          .concat(d.collapsedChildren || [])
          .concat(d.hiddenChildren || []);
        d.children = d.children.filter(child => !child.isAggregated);
        d.collapsedChildren = null;
        d.hiddenChildren = null;
      }
      d.isAggregated = false;
    });
  }

  sortAndScaleTree() {
    this.resetTree();

    this.root.sort(
      (a, b) =>
        b.data.values[this.options.attribute] -
        a.data.values[this.options.attribute]
    );

    console.log(
      "computing range",
      this.root,
      this.root.data.values[this.options.attribute]
    );
    this.range = [
      Math.min(
        ...this.root.leaves().map(l => l.data.values[this.options.attribute])
      ),
      this.root.data.values[this.options.attribute],
    ];

    let collapsedScale = scaleLinear()
      .domain(this.range)
      .range([0, 1]);
    this.root.eachAfter(d => {
      if (this.options.collapsed.has(d.id)) {
        d.collapsedChildren = d.children;
        d.children = null;
      } else if (
        !d.data.highlight &&
        collapsedScale(d.data.values[this.options.attribute]) <
          this.options.collapseThreshold
      ) {
        d.collapsedChildren = d.children;
        d.children = null;
      } else if (d.children) {
        d.collapsedChildren = d.children.filter(
          child =>
            !child.data.highlight &&
            collapsedScale(child.data.values[this.options.attribute]) <
              this.options.collapseThreshold
        );
        if (
          d.collapsedChildren.length <= this.options.minNonCollapsableChildren
        ) {
          d.collapsedChildren = null;
        } else {
          d.children = d.children.filter(
            child =>
              child.data.highlight ||
              collapsedScale(child.data.values[this.options.attribute]) >=
                this.options.collapseThreshold
          );
          d.children.length || (d.children = null);

          if (this.hasVisibleChildren(d) && this.hasHiddenChildren(d)) {
            d.children.push({
              id: `other-${d.id}`,
              depth: d.depth + 1,
              height: 0,
              parent: d,
              isAggregated: true,
              data: {
                commonName: `(${d.collapsedChildren.length})`,
                highlight: d.collapsedChildren.some(
                  child => child.data.highlight
                ),
                scientificName: `(${d.collapsedChildren.length})`,
                lineageRank: d.collapsedChildren[0].data.lineageRank,
                values: d.collapsedChildren[0].data.values,
              },
            });
          }
        }
      }
    });
  }

  toggleCollapseNode(node) {
    let updatedNode = node;

    if (
      this.hasAllChildrenCollapsed(node) ||
      this.hasAllChildrenVisible(node)
    ) {
      var temp = node.children;
      node.children = node.collapsedChildren;
      node.collapsedChildren = temp;

      if (!node.collapsedChildren) {
        node.collapsedChildren = node.hiddenChildren;
        node.hiddenChildren = null;
      }
    } else if (this.hasHiddenChildren(node)) {
      node.hiddenChildren = node.collapsedChildren;
      node.collapsedChildren = node.children;
      node.children = null;
    } else if (node.isAggregated) {
      let parent = node.parent;
      parent.children.pop();
      parent.children = parent.children.concat(parent.collapsedChildren);
      parent.collapsedChildren = null;
      updatedNode = parent;
    }

    if (updatedNode.children) {
      updatedNode.children.forEach(child => {
        this.expandCollapsedWithFewChildren(child);
      });
    }
    this.update(
      Object.assign(node, {
        x0: node.x,
        y0: node.y,
      })
    );
    this.options.onCollapsedStateChange &&
      this.options.onCollapsedStateChange(node);
  }

  expandCollapsedWithFewChildren(node) {
    if (
      node.collapsedChildren &&
      node.collapsedChildren.length <= this.options.minNonCollapsableChildren
    ) {
      node.children = (node.children || []).concat(node.collapsedChildren);
      node.collapsedChildren = null;

      node.children.forEach(child => {
        this.expandCollapsedWithFewChildren(child);
      });
    }
  }

  curvedPath(source, target) {
    return `M ${source.y} ${source.x}
            C ${(source.y + target.y) / 2} ${source.x},
            ${(source.y + target.y) / 2} ${target.x},
            ${target.y} ${target.x}`;
  }

  getNodeBoxRefSvg(d, node) {
    let bbox = node.getBBox();
    let y = d.y + this.margins.left;
    let x = d.x + this.margins.top;
    return { x, y, width: bbox.width, height: bbox.height };
  }

  hasAllChildrenCollapsed(d) {
    return !!(!d.children && d.collapsedChildren);
  }

  hasAllChildrenVisible(d) {
    return !!(d.children && !d.collapsedChildren);
  }

  hasChildren(d) {
    return !!(d.children || d.collapsedChildren);
  }

  hasHiddenChildren(d) {
    return !!d.collapsedChildren;
  }

  hasVisibleChildren(d) {
    return !!d.children;
  }

  wrap(textSelection, width) {
    textSelection.each((d, idx, textNodes) => {
      let text = select(textNodes[idx]);
      let words = text.text().split(/\s+/);
      let word,
        line = [],
        lineNumber = 1,
        textHeight = parseFloat(text.style("font-size")),
        lineHeight = textHeight * 1.2,
        x = text.attr("x"),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", x);

      if (words.length == 1) {
        tspan.text(words[0]);
      } else {
        while ((word = words.pop())) {
          line.unshift(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.shift();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text
              .append("tspan")
              .attr("x", x)
              .attr("dy", `${-lineHeight}px`)
              .text(word);
            lineNumber++;
          }
        }
      }

      if (!this.hasVisibleChildren(d)) {
        // TODO: figure out how to align: hacky 1.5px added to dy
        text.attr(
          "dy",
          `${(textHeight + (lineNumber - 1) * lineHeight - 3) / 2}px`
        );
      }
    });
  }

  update(source) {
    if (!this.svg) {
      this.initialize();
    }

    if (!this.options.attribute) {
      // eslint-disable-next-line no-console
      console.error("TidyTree: Option 'attribute' is not defined.");
      return;
    }

    // adjust dimensions
    let width = this.options.minWidth;
    let height = Math.max(
      this.options.minHeight,
      this.options.leafNodeHeight * this.root.leaves().length
    );

    // if (!this.root.x0) {
    this.root.x0 = height / 2;
    this.root.y0 = 0;
    // }

    this.svg
      .transition()
      .duration(this.options.transitionDuration)
      .attr("width", width + this.margins.left + this.margins.right)
      .attr("height", height + this.margins.top + this.margins.bottom);

    d3Tree().size([height, width])(this.root);
    console.log("attribute", this.options.attribute);
    console.log("range", this.range);

    source = source || this.root;

    // compute scales for nodes
    let nodeScale = scaleLinear()
      .domain(this.range)
      .range([4, 20]);
    let linkScale = scaleLinear()
      .domain(this.range)
      .range([1, 20]);
    let fontScale = scaleLinear()
      .domain(this.range)
      .range([this.options.smallerFont, this.options.largerFont]);

    let link = this.pathContainer
      .selectAll(".link")
      .data(this.root.links(), d => {
        return d.target.id;
      });

    // Enter - Links
    let linkEnter = link
      .enter()
      .append("path")
      .attr(
        "class",
        d => `link ${d.target.data.highlight ? "highlighted" : ""}`
      )
      .attr("d", () => {
        let startPoint = { x: source.x0, y: source.y0 };
        return this.curvedPath(startPoint, startPoint);
      });

    // Update - Links
    let linkUpdate = linkEnter.merge(link);
    linkUpdate
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .attr(
        "class",
        d => `link ${d.target.data.highlight ? "highlighted" : ""}`
      )
      .attr("d", d => this.curvedPath(d.source, d.target))
      .attr("stroke-width", d => {
        return linkScale(d.target.data.values[this.options.attribute]);
      });

    // Exit - Links
    link
      .exit()
      .transition()
      .duration(this.options.transitionDuration)
      .attr("d", this.curvedPath(source, source))
      .remove();

    let node = this.nodeContainer
      .selectAll("g.node")
      .data(this.root.descendants(), d => d.id);

    // Enter - Nodes
    let nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", () => {
        let x = (source && source.x0) || this.root.x0;
        let y = (source && source.y0) || this.root.y0;
        return `translate(${y},${x})`;
      });

    let clickableNode = nodeEnter.append("g").attr("class", "clickable");

    clickableNode.append("circle").attr("r", 0);

    clickableNode
      .filter(d => {
        return this.hasChildren(d) || d.isAggregated;
      })
      .append("path")
      .attr("class", "cross")
      .attr("d", "M0,0");

    let textEnter = nodeEnter
      .append("text")
      .style("fill-opacity", 0)
      .on("click", this.options.onNodeLabelClick);

    if (this.tooltipContainer) {
      nodeEnter
        .on("mouseenter", d => {
          this.options.onNodeHover && this.options.onNodeHover(d);
          this.tooltipContainer.classed("visible", true);
        })
        .on("mousemove", node => {
          this.tooltipContainer
            .style("left", currentEvent.pageX + 20 + "px")
            .style("top", currentEvent.pageY + 20 + "px");
        })
        .on("mouseleave", () => {
          this.tooltipContainer.classed("visible", false);
        });
    }

    let nodeUpdate = node.merge(nodeEnter);

    // Update - Nodes
    nodeUpdate
      .transition()
      .duration(this.options.transitionDuration)
      .attr("class", d => {
        let classes =
          "node " +
          `node-${d.id}` +
          (this.hasChildren(d) ? " node__internal" : " node__leaf") +
          (this.hasAllChildrenCollapsed(d) || d.isAggregated
            ? "--collapsed"
            : "");
        return classes;
      })
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

    let textUpdate = textEnter.merge(node.select("text"));

    textUpdate
      .text(d => {
        return (
          (this.options.useCommonName ? d.data.commonName : null) ||
          d.data.scientificName
        );
      })
      .style(
        "text-anchor",
        d => (this.hasVisibleChildren(d) ? "middle" : "start")
      )
      .style(
        "alignment-baseline",
        d => (this.hasVisibleChildren(d) ? "baseline" : "middle")
      )
      .style("font-size", d => fontScale(d.data.values[this.options.attribute]))
      .attr("dy", d => {
        // console.log({
        //   d,
        //   attribute: this.options.attribute,
        //   v: d.data.values[this.options.attribute],
        //   sc: nodeScale(d.data.values[this.options.attribute])});
        return this.hasVisibleChildren(d)
          ? -4 - 1.3 * nodeScale(d.data.values[this.options.attribute])
          : 0;
      })
      .attr(
        "x",
        d =>
          this.hasVisibleChildren(d)
            ? 0
            : 4 + 1.3 * nodeScale(d.data.values[this.options.attribute])
      )
      .call(this.wrap.bind(this), 110);

    textUpdate
      .transition()
      .duration(this.options.transitionDuration)
      .attr("class", d => {
        return this.options.useCommonName && !d.data.commonName
          ? "name-missing"
          : null;
      })
      .style("fill-opacity", 1);

    nodeUpdate
      .select(".clickable")
      .on("click", d => this.toggleCollapseNode(d));

    nodeUpdate
      .select("circle")
      .attr("r", d => nodeScale(d.data.values[this.options.attribute]));

    nodeUpdate.select("path.cross").attr("d", d => {
      let r = nodeScale(d.data.values[this.options.attribute]) * 0.9;
      r = Math.min(r, 8);
      return `M${-r},0 L${r},0 M0,${-r} L0,${r}`;
    });

    // overlays
    // TODO: overlays can be brittle and will be hard to scale if
    // we ever add features like zoom
    if (this.options.addOverlays) {
      nodeUpdate.each((d, index, nodeList) => {
        let overlay = this.container.select(`.node-overlay__${d.id}`);
        if (!overlay.empty()) {
          let text = select(nodeList[index]).select("text");
          let nodeBox = this.getNodeBoxRefSvg(d, text.node());

          let y = this.hasVisibleChildren(d)
            ? nodeBox.y - nodeBox.width / 2 - 20
            : nodeBox.y +
              nodeScale(d.data.values[this.options.attribute]) +
              nodeBox.width;

          let x = this.hasVisibleChildren(d)
            ? nodeBox.x -
              nodeScale(d.data.values[this.options.attribute]) -
              nodeBox.height -
              20
            : nodeBox.x -
              nodeScale(d.data.values[this.options.attribute]) +
              nodeBox.height -
              20;

          overlay
            .transition()
            .duration(this.options.transitionDuration)
            .style("opacity", 1)
            .style("position", "absolute")
            .style("left", `${y}px`)
            .style("top", `${x}px`)
            .select("div.pathogen-label")
            .style("font-size", `${this.options.smallerFont}px`);
        }
      });
    }

    // Exit - Nodes
    let nodeExit = node
      .exit()
      .transition()
      .duration(this.options.transitionDuration)
      .attr("transform", d => {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // overlays
    nodeExit.each(d => {
      let overlay = this.container.select(`.node-overlay__${d.id}`);
      overlay
        .transition()
        .duration(this.options.transitionDuration)
        .style("opacity", 0);
    });

    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);
  }
}
