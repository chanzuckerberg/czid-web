import React from "react";
import { filter, first } from "lodash";

// Separates the children based on type.
// children - this.props.children.
// componentTypes - strings that match the original name of the element's component class.
// Returns an array of matching components.
const extractChildren = (children, componentTypes) => {
  const components = React.Children.toArray(children);

  return componentTypes.map(type =>
    first(filter(components, ["type.name", type]))
  );
};

export default extractChildren;
