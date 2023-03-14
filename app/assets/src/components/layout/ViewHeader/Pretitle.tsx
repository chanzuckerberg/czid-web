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
          <span className={cs.leftArrow}>
            <i className="angle left icon"></i>
          </span>
          {props.children}
        </a>
      </div>
    );
  } else {
    return <div className={cs.pretitle}>{props.children}</div>;
  }
}

export default Pretitle;
