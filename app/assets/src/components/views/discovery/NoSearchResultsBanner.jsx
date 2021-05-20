import PropTypes from "prop-types";
import React from "react";

import InfoBanner from "./InfoBanner";

const NoSearchResultsBanner = ({
  className = null,
  icon,
  link = null,
  listenerLink = null,
  searchType,
}) => {
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

NoSearchResultsBanner.propTypes = {
  icon: PropTypes.elementType.isRequired,
  link: PropTypes.shape({
    href: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    external: PropTypes.bool,
  }),
  listenerLink: PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  searchType: PropTypes.string.isRequired,
};

export default NoSearchResultsBanner;
