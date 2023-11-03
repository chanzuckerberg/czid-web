import React from "react";
import cs from "./TabbedGalleryTab.scss";

interface TabbedGalleryTabProps {
  activeClass: string;
  tabTitle: string;
  tabDescription: string;
  onClick: $TSFixMeFunction;
}

const TabbedGalleryTab = (props: TabbedGalleryTabProps) => {
  return (
    <div onClick={props.onClick} className={`${cs.tabContainer} tabContainer`}>
      <div
        className={cs.tabIndicator}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        style={props.activeClass ? { backgroundColor: "#3867fa" } : null}
      ></div>
      <div className={cs.tabContent}>
        <svg
          className={cs.tabCheckIcon}
          width="21"
          height="22"
          viewBox="0 0 21 22"
          fill={props.activeClass === "active" ? "#3867fa" : "none"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className={cs.outerCircle}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.5168 18.7706C14.7728 18.7706 18.223 15.3204 18.223 11.0644C18.223 6.80843 14.7728 3.35827 10.5168 3.35827C6.26083 3.35827 2.81067 6.80843 2.81067 11.0644C2.81067 15.3204 6.26083 18.7706 10.5168 18.7706Z"
            stroke={props.activeClass === "active" ? "#3867fa" : "#999999"}
            strokeWidth="1.28436"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className={cs.checkMark}
            d="M13.9512 8.82336L10.2202 13.799C10.0523 14.0222 9.79589 14.1617 9.51727 14.1815C9.23864 14.2012 8.96516 14.0991 8.76754 13.9017L6.841 11.9752"
            stroke={props.activeClass === "active" ? "white" : "#999999"}
            strokeWidth="1.28436"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className={cs.tabContentText}>
          <span className={cs.tabTitle}>{props.tabTitle}</span>
          <p className={cs.tabDescription}>{props.tabDescription}</p>
        </div>
      </div>
    </div>
  );
};

export default TabbedGalleryTab;
