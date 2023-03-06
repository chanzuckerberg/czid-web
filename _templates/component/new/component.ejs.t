---
to: <%= path %>/<%= name %>/<%= name %>.tsx
---
import React from "react";
import cs from "./<%= h.inflection.underscore(name, false)%>.scss";

interface <%= name %>Props {
  // define types here
}

export const <%= name %> = ({}: <%= name %>Props) => {
  return (
    <div className={cs.wrapper}>Your new component</div>
  );
};
