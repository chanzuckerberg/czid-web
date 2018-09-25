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

    this.options = Object.assign(
      {
        curvedEdges: false
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
      // includes legend
      top: 60,
      // includes second half of nodes
      bottom: 20,
      // includes root label on the left of the node
      left: 150,
      // includes leaf nodes labels
      right: 150
    };

    this.nodeSize = {
      width: 1,
      height: 16
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

    this.tooltipDiv = select("body")
      .append("div")
      .attr("class", "dendogram__tooltip")
      .style("opacity", 0);
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
    // Attribute value to color number
    this._attrValToColor = {};

    // Get number of attribute values
    let allVals = new Set();
    this.root.leaves().forEach(n => {
      if (n.data && n.data[attrName]) {
        allVals.add(n.data[attrName]);
      }
    });

    console.log("all vals: ", allVals);

    let colors = Colormap.getNScale(
      this.options.colormapName,
      allVals.size + 1
    );
    // Get the absent color from the front and pop from the end
    let absent = colors[0];
    this.options.absentColor = absent;

    function colorNode(head, attrValToColor) {
      // Color the nodes based on the attribute values
      if (!head.data) return absent;
      let colorResult = absent;

      if (!head.children || head.children.length === 0) {
        // Leaf node, no children
        if (attrName in head.data) {
          // Get color based on the desired attribute
          let attrVal = head.data[attrName];
          if (attrVal in attrValToColor) {
            // Value has been assigned a color already
            colorResult = attrValToColor[attrVal];
          } else {
            // New value and new color
            colorResult = colors.pop();
            attrValToColor[attrVal] = colorResult;
          }
        }
      } else {
        // Not a leaf node, get the colors of the children
        let childrenColors = new Set();
        for (let child of head.children) {
          // Want to call all the children to get every node/link colored
          let c = colorNode(child, attrValToColor);
          childrenColors.add(c);
        }
        if (childrenColors.size === 1) {
          // Set colorResult if all the children are the same
          colorResult = childrenColors.values().next().value;
        }
      }

      // Set this node's color
      head.data.color = colorResult;
      return colorResult;
    }

    colorNode(this.root, this._attrValToColor);
  }

  updateLegend() {
    // Generate legend for coloring by attribute name
    if (!this.options.colorGroupAttribute) return;

    let other = this.options.colorGroupMissingName || "Other";
    this._attrValToColor[other] = this.options.absentColor;
    let legend = this.g.select(".legend");
    if (legend.empty()) {
      legend = this.g.append("g").attr("class", "legend");
      let x = this.options.legendX;
      let y = this.options.legendY;

      // Set legend title
      let legendTitle = (this.options.colorGroupLegendTitle || "Legend") + ":";
      legend
        .append("text")
        .attr("x", x - 5)
        .attr("y", y - 25)
        .attr("class", "title")
        .text(legendTitle);

      for (const attrVal in this._attrValToColor) {
        // Add color circle
        let color = this._attrValToColor[attrVal];
        legend
          .append("circle")
          .attr("r", 5)
          .attr("transform", `translate(${x}, ${y})`)
          .style("fill", color);

        // Add text label
        legend
          .append("text")
          .attr("x", x + 15)
          .attr("y", y + 5)
          .text(attrVal);

        y += 30;
      }
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
    this.createScale(-30, 0, this.minTreeSize.width, maxDistance);
    this.updateHighlights();
    this.updateLegend();
    this.adjustXPositions();
    this.adjustYPositions(maxDistance);

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
      })
      .on("click", node => {
        this.clickHandler(
          () => this.markAsHighlight(node),
          () => this.rerootOriginalTree(node)
        );
      })
      .on("mouseover", node => {
        if (!node.children) {
          let md = node.data.name.split("__");
          md.shift();

          if (md.length > 0) {
            this.tooltipDiv.html(md.join(" / "));

            this.tooltipDiv
              .transition()
              .duration(200)
              .style("opacity", 0.9);
          }
        }
      })
      .on("mousemove", node => {
        if (!node.children) {
          this.tooltipDiv
            .style("left", currentEvent.pageX + 20 + "px")
            .style("top", currentEvent.pageY + 20 + "px");
        }
      })
      .on("mouseout", () => {
        if (!node.children) {
          this.tooltipDiv
            .transition()
            .duration(500)
            .style("opacity", 0);
        }
      });

    nodeEnter.append("circle").attr("r", function(node) {
      return node.children ? 3 : 5;
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
      });

    if (this.options.colorGroupAttribute) {
      // Apply colors to the nodes from data.color
      this.g.selectAll(".node").style("fill", function(d) {
        return d.data.color;
      });

      this.g.selectAll(".link").style("stroke", function(d) {
        return d.data.color;
      });
    } else {
      // Color all the nodes light grey. Default not in CSS because that would
      // override D3 styling.
      this.g.selectAll(".node").style("fill", "#cccccc");
    }
  }
}
