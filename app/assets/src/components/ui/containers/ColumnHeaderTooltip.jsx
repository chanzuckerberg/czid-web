import React from "react";
import BasicPopup from "~/components/BasicPopup";
import PropTypes from "prop-types";
import cs from "./column_header_tooltip.scss";

class ColumnHeaderTooltip extends React.Component {
  render() {
    return (
      <BasicPopup
        {...this.props}
        content={
          <div className={cs.tooltip}>
            {this.props.title && (
              <span className={cs.title}>{this.props.title}:</span>
            )}
            {this.props.content}
            {this.props.list &&
              this.props.list.map(item => {
                return <li key={item}>{item}</li>;
              })}
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
  title: PropTypes.string,
  link: PropTypes.string,
  list: PropTypes.arrayOf(PropTypes.string),
};

ColumnHeaderTooltip.defaultProps = {
  basic: false,
  hoverable: true,
  inverted: false,
  size: "small",
  position: "top center",
};

export default ColumnHeaderTooltip;
