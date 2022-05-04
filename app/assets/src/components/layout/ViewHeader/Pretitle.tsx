import React from "react";
import cs from "./view_header.scss";

interface PretitleProps {
  breadcrumbLink?: string;
  children: React.ReactNode;
}

function Pretitle(props: PretitleProps) {
  const { breadcrumbLink } = props;
  if (breadcrumbLink) {
    return (
      <div className={cs.pretitle}>
        <a href={breadcrumbLink} className={cs.link}>
          {props.children}
        </a>
        <span className={cs.rightArrow}>
          <i className="fa fa-angle-right" aria-hidden="true" />
        </span>
      </div>
    );
  } else {
    return <div className={cs.pretitle}>{props.children}</div>;
  }
}

export default Pretitle;
