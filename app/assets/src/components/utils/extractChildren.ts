import { filter, first } from "lodash";
import React from "react";

// Separates the children based on type.
// children - this.props.children.
// componentTypes - strings that match the original name of the element's component class.
// Returns an array of matching components.
const extractChildren = (
  children: React.ReactNode | React.ReactNode[],
  componentTypes: string[],
) => {
  const components = React.Children.toArray(children);

  return componentTypes.map(type =>
    first(filter(components, ["type.name", type])),
  );
};

export default extractChildren;
