---
to: <%= path %>/<%= Name %>/<%= Name %>.tsx
---
import React from "react";
import cs from "./<%= h.inflection.underscore(name, false)%>.scss";

interface <%= Name %>Props {
  // define types here
}

export const <%= Name %> = ({}: <%= Name %>Props) => {
  return (
    <div className={cs.wrapper}>Your new component</div>
  );
};