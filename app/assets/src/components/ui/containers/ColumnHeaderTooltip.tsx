import React from "react";
import BasicPopup from "~/components/BasicPopup";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PopupProps } from "../../../../../../node_modules/semantic-ui-react/dist/commonjs/modules/Popup/index";
import cs from "./column_header_tooltip.scss";

interface ColumnHeaderTooltipProps extends PopupProps {
  content?: React.ReactNode;
  title?: string;
  link?: string;
}

class ColumnHeaderTooltip extends React.Component<ColumnHeaderTooltipProps> {
  static defaultProps: ColumnHeaderTooltipProps;
  render() {
    const { content, link, title } = this.props;
    return (
      <BasicPopup
        {...this.props}
        content={
          <div className={cs.tooltip}>
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
  }
}

ColumnHeaderTooltip.defaultProps = {
  basic: false,
  hoverable: true,
  inverted: false,
  size: "small",
  position: "top center",
};

export default ColumnHeaderTooltip;
