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
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  className = null,
  icon,
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  link = null,
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
  listenerLink = null,
  searchType,
}: NoSearchResultsBannerProps) => {
  return (
    <InfoBanner
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      className={!!className && className}
      icon={icon}
      link={!!link && link}
      listenerLink={!!listenerLink && listenerLink}
      message={`Sorry, no ${searchType} results were found, please try another search.`}
      title={`0 ${searchType} Search Results`}
      type={searchType}
    />
  );
};

export default NoSearchResultsBanner;
