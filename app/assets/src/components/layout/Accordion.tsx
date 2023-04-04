import cx from "classnames";
import React, { useState } from "react";

import { IconArrowDownSmall, IconArrowUpSmall } from "~ui/icons";

import cs from "./accordion.scss";

interface AccordionProps {
  className?: string;
  headerClassName?: string;
  iconClassName?: string;
  toggleable?: boolean;
  // the vertical alignment of the toggle arrow with other header elements
  toggleArrowAlignment?: "center" | "baseline" | "topRight";
  // Accordion can be controlled or non-controlled.
  onToggle?: () => void;
  open?: boolean;
  // Useful for separating the accordion content from the elements below it.
  bottomContentPadding?: boolean;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const Accordion = ({
  header,
  headerClassName,
  children,
  toggleable = true,
  className,
  iconClassName,
  bottomContentPadding,
  toggleArrowAlignment = "center",
  open: propsOpen = false,
  onToggle: propsOnToggle,
}: AccordionProps) => {
  const [wasToggled, setWasToggled] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const onToggle = () => {
    setStateOpen(wasToggled ? !stateOpen : !propsOpen);
    setWasToggled(true);
  };

  const open = wasToggled ? stateOpen : propsOpen;

  return (
    <div className={cx(cs.accordion, className)}>
      <div
        className={cx(
          cs.header,
          toggleable && cs.toggleable,
          cs[toggleArrowAlignment],
          !!headerClassName && headerClassName,
        )}
        onClick={propsOnToggle || onToggle}
      >
        {header}
        <div className={cs.fill} />
        {toggleable && (
          <div className={cs.toggleContainer}>
            {open ? (
              <IconArrowUpSmall
                className={cx(
                  cs.toggleIcon,
                  iconClassName,
                  cs[toggleArrowAlignment],
                )}
              />
            ) : (
              <IconArrowDownSmall
                className={cx(
                  cs.toggleIcon,
                  iconClassName,
                  cs[toggleArrowAlignment],
                )}
              />
            )}
          </div>
        )}
      </div>
      {(open || !toggleable) && (
        <div
          className={cx(cs.content, bottomContentPadding && cs.bottomPadding)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;
