import React from "react";
import PropTypes from "prop-types";
import cs from "./view_header.scss";

class Pretitle extends React.Component {
  render() {
    const { breadcrumbLink } = this.props;
    if (breadcrumbLink) {
      return (
        <div className={cs.pretitle}>
          <a href={breadcrumbLink} className={cs.link}>
            {this.props.children}
          </a>
          <span className={cs.rightArrow}>{">"}</span>
        </div>
      );
    } else {
      return <div className={cs.pretitle}>{this.props.children}</div>;
    }
  }
}

Pretitle.propTypes = {
  breadcrumbLink: PropTypes.string,
  children: PropTypes.node
};

export default Pretitle;
