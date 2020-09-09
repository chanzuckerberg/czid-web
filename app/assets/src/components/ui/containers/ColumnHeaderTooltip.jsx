import React from "react";
import BasicPopup from "~/components/BasicPopup";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import PropTypes from "prop-types";
import cs from "./column_header_tooltip.scss";

class ColumnHeaderTooltip extends React.Component {
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
                <ExternalLink href={link}>Learn more.</ExternalLink>
              </React.Fragment>
            )}
          </div>
        }
      />
    );
  }
}

ColumnHeaderTooltip.propTypes = {
  content: PropTypes.node,
  title: PropTypes.string,
  link: PropTypes.string,
};

ColumnHeaderTooltip.defaultProps = {
  basic: false,
  hoverable: true,
  inverted: false,
  size: "small",
  position: "top center",
};

export default ColumnHeaderTooltip;
