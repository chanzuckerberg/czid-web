import React from "react";
import cs from "./view_header.scss";

// eslint-disable-next-line no-empty-pattern
function Pretitle({}: PretitleProps) {
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

interface PretitleProps {
  breadcrumbLink?: string,
  children: React.ReactNode
}

export default Pretitle;
