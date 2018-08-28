import { cluster as d3Cluster, hierarchy } from "d3-hierarchy";
import "d3-transition";
import { timeout } from "d3-timer";
import { select, event as currentEvent } from "d3-selection";

export default class PhyloTree {
  constructor(container, tree) {
    this.svg = null;
    this.container = container;
    this.tree = null;
    this.root = null;

    // size
    this.width = 800;
    this.height = 600;
    this.innerLabelWidth = 60;
    this.outerLabelWidth = 150;

    this._highlighted = new Set();

    // timeout to differentiate click from double click
    this._clickTimeout = null;

    this.setTree(tree);
    this.initialize();
  }

  initialize() {
    this.svg = select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", `translate(${this.innerLabelWidth}, 60)`);

    this.tooltipDiv = select("body")
      .append("div")
      .attr("class", "dendogram__tooltip")
      .style("opacity", 0);
  }

  setTree(tree) {
    if (this.svg) {
      this.svg.selectAll("*").remove();
    }

    if (this._clickTimeout) {
      this._clickTimeout.stop();
      this._clickTimeout = null;
    }
    this._highlighted.clear();
    this.tree = tree;
    this.root = tree ? hierarchy(this.tree.root) : null;
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

  rerootTree(nodeToRoot) {
    // TODO: move this to operate on the original tree
    let ancestors = nodeToRoot.ancestors();

    while (ancestors.length > 2) {
      let nodeToMove = ancestors.pop();
      // remove the next ancestor from children
      let previousAncestor = ancestors[ancestors.length - 1];
      this.detachFromParent(previousAncestor);

      // set node's new distance, descendants depth and depth
      nodeToMove.data.distance = previousAncestor.data.distance;
      nodeToMove.parent = previousAncestor;
      previousAncestor.children.push(nodeToMove);
    }

    this.root = ancestors.pop();
    this.root.data.distance = 0;
    this.root.depth = 0;
    this.root.parent = null;

    this.root.children.forEach(node => {
      node.data.distance += nodeToRoot.data.distance;
    });
    nodeToRoot.data.distance = 0;

    // reset depths
    this.root.eachBefore(node => {
      if (node.parent) {
        node.depth += node.parent.depth + 1;
      }
    });

    // reset Height
    this.root.eachAfter(node => {
      if (node.children && node.children.length > 0) {
        node.height =
          node.children.reduce((acc, child) => Math.max(child.height, acc), 0) +
          1;
      }
    });

    this.update();
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

  createScale(x, y, width, distance) {
    function drawPath(x0, x1, y0, y1, y2) {
      return `M${y0} ${x0} L${y0} ${x1} L${y2} ${x1} M${y1} ${x0} L${y1} ${x1} M${y2} ${x0} L${y2} ${x1}`;
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

    const scale = this.svg.selectAll(".scale").data(["scale"]);

    const enterScale = scale
      .enter()
      .append("g")
      .attr("transform", `translate(${y},${x})`)
      .attr("class", "scale");

    enterScale
      .append("path")
      .attr("class", "scale-line")
      .attr("d", drawPath(0, tickWidth, 0, scaleSize / 2, scaleSize));

    enterScale
      .append("text")
      .attr("class", "scale-min")
      .attr("dy", -3)
      .style("text-anchor", "middle")
      .text(0);

    enterScale
      .append("text")
      .attr("class", "scale-max")
      .attr("y", -3)
      .attr("x", scaleSize)
      .style("text-anchor", "middle")
      .text(this.formatBase10(multiplier, power));

    scale
      .select("path")
      .transition()
      .duration(500)
      .attr("d", drawPath(0, tickWidth, 0, scaleSize / 2, scaleSize));

    scale
      .select("text.scale-max")
      .transition()
      .duration(500)
      .attr("x", scaleSize);

    scale.select("text.scale-max").text(this.formatBase10(multiplier, power));
  }

  update() {
    if (!this.root) {
      return;
    }

    if (!this.svg) {
      this.initialize();
    }

    function curveEdge(d) {
      return `M${d.y},${d.x}C${d.parent.y + 100},${d.x} ${d.parent.y + 100},${
        d.parent.x
      } ${d.parent.y},${d.parent.x}`;
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

    let cluster = d3Cluster().size([500, 500]);

    cluster(this.root);

    let maxDistance = this.computeDistanceToRoot(this.root);

    this.createScale(-30, 100, this.width - this.outerLabelWidth, maxDistance);

    this.updateHighlights();

    this.root.each(node => {
      node.y =
        (this.width - this.outerLabelWidth) * node.distanceToRoot / maxDistance;
    });

    let link = this.svg
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
      .attr("d", rectEdge);

    link.classed("highlight", function(d) {
      return d.data.highlight && d.parent.data.highlight;
    });

    link
      .transition()
      .duration(500)
      .attr("d", rectEdge);

    this.svg.selectAll(".link.highlight").raise();

    let node = this.svg
      .selectAll(".node")
      .data(this.root.descendants(), nodeId);

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
        if (!node.children || node.children.length === 0) {
          this.clickHandler(
            () => this.markAsHighlight(node),
            () => this.rerootOriginalTree(node)
          );
        }
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
      return node.children ? 3 : 7;
    });

    nodeEnter
      .append("text")
      .attr("dy", function(d) {
        return d.children ? -2 : 5;
      })
      .attr("x", function(d) {
        return d.children ? -8 : 15;
      })
      .style("text-anchor", function(d) {
        return d.children ? "end" : "start";
      })
      .text(function(d) {
        return d.children ? "" : d.data.name.split("__")[0];
      });
  }
}
