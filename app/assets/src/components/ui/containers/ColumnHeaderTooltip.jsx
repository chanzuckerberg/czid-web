import React from "react";
import { Popup } from "semantic-ui-react";
import PropTypes from "prop-types";
import cs from "./column_header_tooltip.scss";

class ColumnHeaderTooltip extends React.Component {
  render() {
    return (
      <Popup
        on="hover"
        {...this.props}
        hoverable
        content={
          <div className={cs.tooltip}>
            <span className={cs.title}>{this.props.title}:</span>
            {this.props.content}
            {this.props.link && (
              <a
                className={cs.link}
                target="_blank"
                rel="noopener noreferrer"
                href={this.props.link}
              >
                Learn more.
              </a>
            )}
          </div>
        }
      />
    );
  }
}

ColumnHeaderTooltip.propTypes = {
  size: PropTypes.string,
  wide: PropTypes.string,
  title: PropTypes.string,
  link: PropTypes.string,
};

ColumnHeaderTooltip.defaultProps = {
  size: "small",
  position: "top center",
  mouseEnterDelay: 300,
};

export default ColumnHeaderTooltip;
