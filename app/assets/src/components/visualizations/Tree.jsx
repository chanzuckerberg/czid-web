import { select } from "d3-selection";

export default class Tree {
  constructor(container, data, options) {
    this.container = container;
    this.data = data;

    this.svg = null;
    this.g = null;

    this.options = Object.assign(
      {
        width: 1000
      },
      options || {}
    );
  }

  initialize() {
    this.svg = select(this.container)
      .append("svg")
      .attr("width", this.options.width)
      .attr("height", this.options.height);
  }
}
