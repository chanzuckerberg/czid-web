import { Icon } from "czifui";
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
        <span className={cs.leftArrow}>
          <Icon sdsType={"static"} sdsIcon={"chevronLeft"} sdsSize={"xs"} />
        </span>
        <a href={breadcrumbLink} className={cs.link}>
          {props.children}
        </a>
      </div>
    );
  } else {
    return <div className={cs.pretitle}>{props.children}</div>;
  }
}

export default Pretitle;
