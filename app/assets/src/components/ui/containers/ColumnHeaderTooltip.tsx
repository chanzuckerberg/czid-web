import React from "react";
import { PopupProps } from "semantic-ui-react";
import BasicPopup from "~/components/BasicPopup";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import cs from "./column_header_tooltip.scss";

interface ColumnHeaderTooltipProps extends PopupProps {
  content?: React.ReactNode;
  title?: string;
  link?: string;
}

const ColumnHeaderTooltip = ({
  content,
  title,
  link,
  ...popUpProps
}: ColumnHeaderTooltipProps) => {
  return (
    <BasicPopup
      {...popUpProps}
      content={
        <div data-testid="column-tooltip" className={cs.tooltip}>
          {title && <span className={cs.title}>{title}:</span>}
          {content}
          {link && (
            <React.Fragment>
              {" "}
              <ExternalLink
                href={link}
                analyticsEventName={`Tooltip_${title}-learn-more-link_clicked`}
                analyticsEventData={{ link }}
              >
                Learn more.
              </ExternalLink>
            </React.Fragment>
          )}
        </div>
      }
    />
  );
};

ColumnHeaderTooltip.defaultProps = {
  basic: false,
  hoverable: true,
  inverted: false,
  size: "small",
  position: "top center",
};

export default ColumnHeaderTooltip;
