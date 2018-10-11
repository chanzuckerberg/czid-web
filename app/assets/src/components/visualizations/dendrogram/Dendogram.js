import { cluster as d3Cluster, hierarchy } from "d3-hierarchy";
import "d3-transition";
import { timeout } from "d3-timer";
import { select, event as currentEvent } from "d3-selection";
import { Colormap } from "../../utils/colormaps/Colormap";

export default class Dendogram {
  constructor(container, tree, options) {
    this.svg = null;
    this.g = null;
    this.container = container;
    this.tree = null;
    this.root = null;
    this.legend = null;

    this.options = Object.assign(
      {
        curvedEdges: false,
        defaultColor: "#cccccc",
        colormapName: "viridis",
        colorGroupAttribute: null,
        colorGroupLegendTitle: null,
        colorGroupAbsentName: null,
        legendX: 880,
        legendY: 0,
        onNodeTextClick: null,
        onNodeClick: null,
        onNodeHover: null,
        tooltipContainer: null,
        scaleLabel: null
      },
      options || {}
    );

    // sizes
    this.minTreeSize = {
      width: 600,
      height: 500
    };

    // margin top
    this.margins = {
      // includes scale legend
      top: 160,
      // includes second half of nodes
      bottom: 20,
      // includes root label on the left of the node
      left: 150,
      // includes leaf nodes labels
      right: 150
    };

    this.nodeSize = {
      width: 1,
      height: 25
    };

    this._highlighted = new Set();

    // timeout to differentiate click from double click
    this._clickTimeout = null;

    this.setTree(tree);
    this.initialize();
  }

  initialize() {
    this.svg = select(this.container)
      .append("svg")
      .attr(
        "width",
        this.minTreeSize.width + this.margins.left + this.margins.right
      )
      .attr(
        "height",
        this.minTreeSize.height + this.margins.top + this.margins.bottom
      );

    this.g = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.margins.left}, ${this.margins.top})`
      );

    this.tooltipContainer = select(this.options.tooltipContainer);
  }

  adjustHeight(treeHeight) {
    this.svg.attr(
      "height",
      Math.max(treeHeight, this.minTreeSize.height) +
        this.margins.top +
        this.margins.bottom
    );
  }

  setTree(tree) {
    if (this.g) {
      this.g.selectAll("*").remove();
    }

    if (this._clickTimeout) {
      this._clickTimeout.stop();
      this._clickTimeout = null;
    }
    this._highlighted.clear();
    this.tree = tree;
    this.root = tree ? hierarchy(this.tree.root) : null;

    this.updateColors();
  }

  computeDistanceToRoot(node, offset = 0) {
    let maxDistance = 0;
    node.distanceToRoot = (node.data.distance || 0) + offset;

    if (node.children !== undefined) {
      for (let i = 0; i < node.children.length; i++) {
        maxDistance = Math.max(
          this.computeDistanceToRoot(node.children[i], node.distanceToRoot),
          maxDistance
        );
      }
    }

    return Math.max(maxDistance, node.distanceToRoot);
  }

  detachFromParent(node) {
    let childIndex = (node.parent.children || []).indexOf(node);
    node.parent.children.splice(childIndex, 1);
    delete node.parent;
  }

  rerootOriginalTree(nodeToRoot) {
    this.tree.rerootTree(nodeToRoot.data.id);
    this.root = hierarchy(this.tree.root);
    this.update();
  }

  markAsHighlight(node) {
    if (this._highlighted.has(node.data.id)) {
      this._highlighted.delete(node.data.id);
    } else {
      this._highlighted.add(node.data.id);
    }
    this.update();
  }

  updateHighlights() {
    this.root.descendants().forEach(n => (n.data.highlight = false));

    this.root.leaves().forEach(leaf => {
      if (this._highlighted.has(leaf.data.id)) {
        leaf.ancestors().forEach(ancestor => {
          ancestor.data.highlight = true;
        });
      }
    });
  }

  updateColors() {
    // Color clusters of the nodes based on the color group attribute.
    // Color a node if all its children have the same color.
    if (!this.options.colorGroupAttribute) {
      return;
    }

    let attrName = this.options.colorGroupAttribute;
    let absentName = this.options.colorGroupAbsentName;

    // Set up all attribute values. Colors end up looking like:
    // Uncolored (grey) | Absent attribute color (e.g. for NCBI References) + Actual seen values..
    let allVals = new Set();
    this.root.leaves().forEach(n => {
      if (n.data) {
        if (n.data.hasOwnProperty(attrName)) {
          allVals.add(n.data[attrName]);
        } else {
          allVals.add(absentName);
        }
      }
    });
    allVals = Array.from(allVals);

    // Just leave everything the uncolored color if there is only the absent
    // value
    this.skipColoring = false;
    if (allVals.length === 1 && allVals[0] === absentName) {
      this.skipColoring = true;
      return;
    }

    allVals = ["Uncolored"].concat(allVals);
    this.allColorAttributeValues = allVals;

    // Set up colors array
    this.colors = Colormap.getNScale(this.options.colormapName, allVals.length);
    this.colors = [this.options.defaultColor].concat(this.colors);

    function colorNode(head) {
      // Color the nodes based on the attribute values
      if (!head.data) return 0; // 0 for uncolored default
      let colorResult = 0;

      if (!head.children || head.children.length === 0) {
        // Leaf node, no children
        let attrVal;
        if (head.data.hasOwnProperty(attrName)) {
          // Get color based on the desired attribute
          attrVal = head.data[attrName];
        } else {
          // Leaf node but missing the attribute
          attrVal = absentName;
        }
        colorResult = allVals.indexOf(attrVal);
      } else {
        // Not a leaf node, get the colors of the children
        let childrenColors = new Set();
        for (let child of head.children) {
          // Want to call all the children to get every node/link colored
          childrenColors.add(colorNode(child));
        }
        if (childrenColors.size === 1) {
          // Set colorResult if all the children are the same
          colorResult = childrenColors.values().next().value;
        }
      }

      // Set this node's color
      head.data.colorIndex = colorResult;
      return colorResult;
    }

    colorNode(this.root);
  }

  updateLegend() {
    // Generate legend for coloring by attribute name
    if (!this.options.colorGroupAttribute || this.skipColoring) {
      return;
    }

    let allVals = this.allColorAttributeValues;
    this.legend = this.g.select(".legend");
    if (this.legend.empty()) {
      this.legend = this.g.append("g").attr("class", "legend");
      let x = this.options.legendX;
      let y = this.options.legendY;

      // Set legend title
      let legendTitle = (this.options.colorGroupLegendTitle || "Legend") + ":";
      this.legend
        .append("text")
        .attr("class", "legend-title")
        .attr("x", x)
        .attr("y", y)
        .text(legendTitle);

      x += 5;
      y += 25;

      for (let i = 1; i < allVals.length; i++, y += 30) {
        // First of values and colors is the placeholder for 'Uncolored'

        // Add color circle
        let color = this.colors[i];
        this.legend
          .append("circle")
          .attr("r", 5)
          .attr("transform", `translate(${x}, ${y})`)
          .style("fill", color);

        // Add text label
        this.legend
          .append("text")
          .attr("x", x + 15)
          .attr("y", y + 5)
          .text(allVals[i]);
      }

      // background rectangle
      let bbox = this.legend.node().getBBox();
      let bgMargin = 10;
      this.legend
        .append("rect")
        .attr("class", "legend-background")
        .attr("x", bbox.x - bgMargin)
        .attr("y", bbox.y - bgMargin)
        .attr("width", bbox.width + 2 * bgMargin)
        .attr("height", bbox.height + 2 * bgMargin)
        .lower();
    }
  }

  clickHandler(clickCallback, dblClickCallback, delay = 250) {
    if (this._clickTimeout) {
      this._clickTimeout.stop();
      this._clickTimeout = null;
      if (typeof dblClickCallback === "function") dblClickCallback();
    } else {
      this._clickTimeout = timeout(() => {
        this._clickTimeout = null;
        clickCallback();
      }, delay);
    }
  }

  formatBase10(multiplier, power) {
    if (-1 <= power <= 1) {
      return Number.parseFloat(multiplier * Math.pow(10, power)).toFixed(2) * 1;
    } else {
      return `${multiplier}E${power}`;
    }
  }

  adjustXPositions() {
    let xMin = this.root.x;
    let xMax = this.root.x;
    this.root.each(node => {
      if (node.x < xMin) {
        xMin = node.x;
      }
      if (node.x > xMax) {
        xMax = node.x;
      }
    });
    const xRange = xMax - xMin;
    let finalTreeHeight =
      xRange < this.minTreeSize.height ? this.minTreeSize.height : xRange;

    this.root.each(node => {
      node.x = (node.x - xMin) * finalTreeHeight / xRange;
    });
    this.adjustHeight(finalTreeHeight);
  }

  adjustYPositions(maxDistance) {
    this.root.each(node => {
      node.y = this.minTreeSize.width * node.distanceToRoot / maxDistance;
    });
  }

  createScale(x, y, width, distance) {
    function createTicks(yMin, yMax, stepSize, multiplier) {
      let ticks = [{ id: 0, y: yMin, multiplier: 0 }];
      for (let i = 0; i <= yMax / stepSize; i++) {
        ticks.push({
          id: i + 1,
          y: yMin + i * stepSize,
          multiplier: i % 2 ? undefined : i * multiplier / 2
        });
      }
      return ticks;
    }

    function drawScale(xMax, yMin, yMax) {
      return `M${yMin} ${xMax} L${yMax} ${xMax}`;
    }

    function drawTick(xMin, xMax, y) {
      return `M${y} ${xMin} L${y} ${xMax}`;
    }

    const tickWidth = 10;
    const initialScaleSize = 100;

    let initialValue = distance * initialScaleSize / width;
    const power = Math.floor(Math.log10(initialValue));
    let scaleSize = Math.pow(10, power) * initialScaleSize / initialValue;
    const multiplier = Math.round(initialScaleSize / scaleSize);
    if (multiplier) {
      scaleSize *= multiplier;
    }
    const tickElements = createTicks(0, width, scaleSize / 2, multiplier);

    let scale = this.g.select(".scale");

    if (scale.empty()) {
      scale = this.g
        .append("g")
        .attr("transform", `translate(${y},${x})`)
        .attr("class", "scale");

      scale
        .append("path")
        .attr("class", "scale-line")
        .attr("d", function() {
          return drawScale(tickWidth, 0, width);
        });
    } else {
      scale
        .select("path")
        .transition()
        .duration(500)
        .attr("d", function() {
          return drawScale(tickWidth, 0, width);
        });
    }

    let ticks = scale
      .selectAll(".scale-tick")
      .data(tickElements, tick => tick.id);

    let enterTicks = ticks
      .enter()
      .append("g")
      .attr("class", "scale-tick")
      .attr("transform", tick => `translate(${tick.y},0)`);

    enterTicks.append("path").attr("d", drawTick(0, tickWidth, 0));

    enterTicks
      .append("text")
      .attr("dy", -3)
      .style("text-anchor", "middle")
      .text(
        tick =>
          tick.multiplier === undefined
            ? ""
            : this.formatBase10(tick.multiplier, power)
      );

    ticks
      .transition()
      .duration(500)
      .attr("transform", tick => `translate(${tick.y},0)`);

    ticks
      .exit()
      .transition(500)
      .style("opacity", 0)
      .remove();

    // Set scale label
    scale
      .append("text")
      .attr("class", "scale-label")
      .attr("x", x + 78)
      .attr("y", y - 30)
      .text(this.options.scaleLabel);
  }

  update() {
    if (!this.root) {
      return;
    }

    if (!this.g) {
      this.initialize();
    }

    function curveEdge(d) {
      return (
        "M" +
        d.y +
        "," +
        d.x +
        "C" +
        (d.y + d.parent.y) / 2 +
        "," +
        d.x +
        " " +
        (d.y + d.parent.y) / 2 +
        "," +
        d.parent.x +
        " " +
        d.parent.y +
        "," +
        d.parent.x
      );
    }

    function rectEdge(d) {
      return `M${d.y} ${d.x} L${d.parent.y} ${d.x} L${d.parent.y} ${
        d.parent.x
      }`;
    }

    function nodeId(node) {
      return node.data.id;
    }

    function linkId(node) {
      if (node.parent) {
        let ids = [node.data.id, node.parent.data.id];
        ids.sort();
        return `${ids[0]}-${ids[1]}`;
      }
      return null;
    }

    let cluster = d3Cluster()
      .size([this.minTreeSize.height, this.minTreeSize.width])
      .nodeSize([this.nodeSize.height, this.nodeSize.width]);

    cluster(this.root);

    let maxDistance = this.computeDistanceToRoot(this.root);
    this.updateHighlights();
    this.updateLegend();
    this.adjustXPositions();
    this.adjustYPositions(maxDistance);
    this.createScale(-80, 0, this.minTreeSize.width, maxDistance);

    let link = this.g
      .selectAll(".link")
      .data(this.root.descendants().slice(1), linkId);

    link
      .exit()
      .transition(500)
      .style("opacity", 0)
      .remove();

    link
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", this.options.curvedEdges ? curveEdge : rectEdge);

    link.classed("highlight", function(d) {
      return d.data.highlight && d.parent.data.highlight;
    });

    link
      .transition()
      .duration(500)
      .attr("d", this.options.curvedEdges ? curveEdge : rectEdge);

    this.g.selectAll(".link.highlight").raise();

    let node = this.g.selectAll(".node").data(this.root.descendants(), nodeId);

    node
      .exit()
      .transition(500)
      .style("opacity", 0)
      .remove();

    node.raise();

    node
      .transition()
      .duration(500)
      .attr("transform", function(node) {
        return "translate(" + node.y + "," + node.x + ")";
      });

    node.classed("highlight", function(d) {
      return d.data.highlight;
    });

    node
      .select("text")
      .transition()
      .duration(500)
      .attr("x", function(d) {
        return d.depth === 0
          ? -(this.getBBox().width + 15)
          : d.children
            ? -8
            : 15;
      });

    let nodeEnter = node
      .enter()
      .append("g")
      .attr("class", function(node) {
        return "node" + (node.children ? " node-internal" : " node-leaf");
      })
      .attr("transform", function(node) {
        return `translate(${node.y},${node.x})`;
      });

    if (!this.tooltipContainer.empty()) {
      nodeEnter
        .on("mouseenter", node => {
          if (!node.children) {
            this.options.onNodeHover && this.options.onNodeHover(node);
            this.tooltipContainer.classed("visible", true);
          }
        })
        .on("mousemove", node => {
          if (!node.children) {
            this.tooltipContainer
              .style("left", currentEvent.pageX + 20 + "px")
              .style("top", currentEvent.pageY + 20 + "px");
          }
        })
        .on("mouseleave", () => {
          if (!node.children) {
            this.tooltipContainer.classed("visible", false);
          }
        });
    }

    nodeEnter
      .append("circle")
      .attr("r", function(node) {
        return node.children ? 3 : 5;
      })
      .on("click", node => {
        this.clickHandler(
          () => this.markAsHighlight(node),
          () => this.rerootOriginalTree(node)
        );
      });

    nodeEnter
      .append("text")
      .attr("dy", function(d) {
        return d.children ? -2 : 5;
      })
      .attr("x", function(d) {
        return d.children ? -8 : 15;
      })
      .text(function(d) {
        return d.children ? "" : d.data.name.split("__")[0];
      })
      .on(
        "click",
        d => this.options.onNodeTextClick && this.options.onNodeTextClick(d)
      );

    if (this.options.colorGroupAttribute && !this.skipColoring) {
      // Apply colors to the nodes from data.colorIndex
      let colors = this.colors;
      this.g.selectAll(".node").style("fill", function(d) {
        return colors[d.data.colorIndex];
      });

      this.g.selectAll(".link").style("stroke", function(d) {
        return colors[d.data.colorIndex];
      });
    } else {
      // Color all the nodes light grey. Default not in CSS because that would
      // override D3 styling.
      this.g.selectAll(".node").style("fill", this.options.defaultColor);
    }

    // legend on top
    this.legend && this.legend.raise();
  }
}
