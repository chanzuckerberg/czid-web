import React from "react";
import { Popup } from "semantic-ui-react";
import PropTypes from "prop-types";
import cs from "./table_tooltip.scss";

class TableTooltip extends React.Component {
  render() {
    return (
      <Popup
        on="hover"
        {...this.props}
        //position="top center"
        //basic
        hoverable
        content={
          <div className={cs.tooltip}>
            <span className={cs.title}>{this.props.title}:</span>
            {this.props.content}
            {this.props.link && (
              <a className={cs.link} target="_blank" href={this.props.link}>
                Learn more.
              </a>
            )}
          </div>
        }
      />
    );
  }
}

TableTooltip.propTypes = {
  size: PropTypes.string,
  wide: PropTypes.string,
  title: PropTypes.string,
  link: PropTypes.string,
};

TableTooltip.defaultProps = {
  size: "small",
};

export default TableTooltip;
