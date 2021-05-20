import PropTypes from "prop-types";
import React from "react";
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
          <span className={cs.rightArrow}>
            <i className="fa fa-angle-right" aria-hidden="true" />
          </span>
        </div>
      );
    } else {
      return <div className={cs.pretitle}>{this.props.children}</div>;
    }
  }
}

Pretitle.propTypes = {
  breadcrumbLink: PropTypes.string,
  children: PropTypes.node,
};

export default Pretitle;
