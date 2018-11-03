import React from "react";
import { clone, difference, filter } from "lodash";

// Separates the children based on type.
// children - this.props.children.
// componentTypes - custom strings that must be manually added to sub-components.
//   ex: static type = "ViewHeader.Content"
// Returns an object that maps types to the matching component, and returns unmatched compoents in 'other'.
const extractChildren = (children, componentTypes) => {
  const components = React.Children.toArray(children);

  let leftoverChildren = clone(components);

  const childMap = {};

  componentTypes.forEach(type => {
    const matchingChildren = filter(components, ["type.type", type]);

    if (matchingChildren.length === 0) {
      childMap[type] = null;
    } else if (matchingChildren.length === 1) {
      childMap[type] = matchingChildren[0];
    } else {
      childMap[type] = matchingChildren;
    }

    leftoverChildren = difference(leftoverChildren, matchingChildren);
  });

  childMap.other = leftoverChildren;

  return childMap;
};

export default extractChildren;
