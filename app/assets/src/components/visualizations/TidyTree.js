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
        minWidth: 1000,
        minHeight: 300,
        transitionDuration: 500,
        onNodeHover: null,
        onCreatedTree: null,
        tooltipContainer: null,
        collapseThreshold: 0.4,
        useCommonName: false
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
    this.svg = this.container
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
    Object.assign(this.options, options);

    if (options.attribute) {
      console.log("attribute changed");
    }
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

    this.root = stratifier(nodes);
    console.log("root", this.root);
    this.options.onCreatedTree && this.options.onCreatedTree(this.root);
    this.sortAndScaleTree();

    this.update();
  }

  sortAndScaleTree() {
    console.log("resort tree - attribute", this.options.attribute);
    this.root.sort(
      (a, b) =>
        b.data.values[this.options.attribute] -
        a.data.values[this.options.attribute]
    );

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

  getNodeBoxRefSvg(d, node) {
    let bbox = node.getBBox();
    let y = d.y + this.margins.left;
    let x = d.x + this.margins.top;
    return { x, y, width: bbox.width, height: bbox.height };
  }

  hasChildren(d) {
    return !!(d.children || d.collapsedChildren);
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
        lineHeight = textHeight * 1.1,
        x = text.attr("x"),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", x);

      if (words.length == 1) {
        tspan.text(words[0]);
      } else {
        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
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
        text.attr(
          "dy",
          `${(textHeight + (lineNumber - 1) * lineHeight - 3) / 2}px`
        );
        // TODO: hacky 1.5 px added to dy
      }
    });
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
      .range([8, 12]);

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

    let clickableNode = nodeEnter
      .append("g")
      .on("click", d => this.toggleCollapseNode(d));

    clickableNode.append("circle").attr("r", 0);

    clickableNode
      .filter(d => this.hasChildren(d))
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

    // overlays
    if (this.options.addOverlays) {
      nodeEnter.each((d, index, nodeList) => {
        let overlay = this.container.select(`.node-overlay__${d.id}`);
        let text = select(nodeList[index]).select("text");
        let fontSize = fontScale(d.data.values[this.options.attribute]);
        let nodeBox = this.getNodeBoxRefSvg(d, text.node());
        overlay
          .style("opacity", 1)
          .style("position", "absolute")
          .style(
            "left",
            `${nodeBox.y + (this.hasVisibleChildren(d) ? -55 : -15)}px`
          )
          .style(
            "top",
            `${nodeBox.x + (this.hasVisibleChildren(d) ? -40 : 6)}px`
          )
          .select("div.pathogen-label")
          .style("font-size", `${fontSize}px`);
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
          (d.collapsedChildren ? "--collapsed" : "");
        return classes;
      })
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

    let textUpdate = textEnter.merge(node.select("text"));

    textUpdate
      .text(d => {
        console.log(d.data.scientificName);
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
      .attr(
        "dy",
        d =>
          this.hasVisibleChildren(d)
            ? -4 - nodeScale(d.data.values[this.options.attribute])
            : 0
      )
      .attr(
        "x",
        d =>
          this.hasVisibleChildren(d)
            ? 0
            : 4 + nodeScale(d.data.values[this.options.attribute])
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
      .select("circle")
      .attr("r", d => nodeScale(d.data.values[this.options.attribute]));

    nodeUpdate.select("path.cross").attr("d", d => {
      let r = nodeScale(d.data.values[this.options.attribute]) * 0.9;
      r = Math.min(r, 8);
      return `M${-r},0 L${r},0 M0,${-r} L0,${r}`;
    });

    // overlays
    if (this.options.addOverlays) {
      nodeUpdate.each((d, index, nodeList) => {
        let overlay = this.container.select(`.node-overlay__${d.id}`);
        let text = select(nodeList[index]).select("text");
        let fontSize = fontScale(d.data.values[this.options.attribute]);
        let nodeBox = this.getNodeBoxRefSvg(d, text.node());
        overlay
          .transition()
          .duration(this.options.transitionDuration)
          .style("position", "absolute")
          .style(
            "left",
            `${nodeBox.y + (this.hasVisibleChildren(d) ? -55 : -15)}px`
          )
          .style(
            "top",
            `${nodeBox.x + (this.hasVisibleChildren(d) ? -40 : 6)}px`
          )
          .select("div.pathogen-label")
          .style("font-size", `${fontSize}px`);
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
