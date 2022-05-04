import cx from "classnames";
import React from "react";
import cs from "./narrow_container.scss";

interface NarrowContainerProps {
  children: React.ReactNode[] | React.ReactNode;
  className?: string;
  size?: "small" | "large";
}

const NarrowContainer = ({
  children,
  className,
  size,
}: NarrowContainerProps) => {
  // NarrowContainer will enforce our policy for page width
  // As a general rule, should be applied to most page contents and headers
  return (
    <div className={cx(cs.narrowContainer, className, size && cs[size])}>
      {children}
    </div>
  );
};

export default NarrowContainer;
