import { cx } from "@emotion/css";
import { Button, Icon } from "czifui";
import React from "react";

import cs from "./help_button.scss";

const HelpButton = ({ className, onClick }: HelpButtonProps) => (
  <Button
    className={cx(cs.helpButton, className)}
    sdsType="secondary"
    sdsStyle="rounded"
    startIcon={<Icon sdsIcon="questionMark" sdsSize="l" sdsType="button" />}
    onClick={onClick}
  />
);

interface HelpButtonProps {
  className?: string;
  onClick: $TSFixMeFunction;
}

export default HelpButton;
