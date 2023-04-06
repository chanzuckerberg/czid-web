import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { TooltipTextType } from "./types";

interface TooltipTextProps {
  tooltipStrings?: TooltipTextType;
}

export const TooltipText = ({
  tooltipStrings,
}: TooltipTextProps): JSX.Element | null => {
  if (!tooltipStrings) return null;

  const { boldText, regularText, link } = tooltipStrings;
  const { href, linkText } = link ?? {};

  return (
    <div>
      <b>{boldText}</b>: {regularText}{" "}
      {link && <ExternalLink href={href}>{linkText}</ExternalLink>}
    </div>
  );
};
