import React from "react";

import InfoBanner from "./InfoBanner";

interface NoSearchResultsBannerProps {
  className?: string;
  icon: React.ElementType;
  link?: {
    href: string;
    text: string;
    external?: boolean;
  };
  listenerLink?: {
    text: string;
    onClick: $TSFixMeFunction;
  };
  searchType: string;
}

const NoSearchResultsBanner = ({
  className = null,
  icon,
  link = null,
  listenerLink = null,
  searchType,
}: NoSearchResultsBannerProps) => {
  return (
    <InfoBanner
      className={className && className}
      icon={icon}
      link={link && link}
      listenerLink={listenerLink && listenerLink}
      message={`Sorry, no ${searchType} results were found, please try another search.`}
      title={`0 ${searchType} Search Results`}
      type={searchType}
    />
  );
};

export default NoSearchResultsBanner;
