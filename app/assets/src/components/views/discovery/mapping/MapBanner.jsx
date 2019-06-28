import PropTypes from "prop-types";
import React from "react";

import { withAnalytics } from "~/api/analytics";

import cs from "./map_banner.scss";

class MapBanner extends React.Component {
  render() {
    const { subject, itemCount, onClearFilters } = this.props;
    if (!itemCount) {
      return (
        <div className={cs.bannerContainer}>
          <div className={cs.banner}>
            {`No ${subject} found. Try adjusting search or filters. `}
            <span
              className={cs.clearAll}
              onClick={withAnalytics(
                onClearFilters,
                "MapBanner_clear-filters-link_clicked",
                {
                  currentTab: subject,
                }
              )}
            >
              Clear all
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className={cs.bannerContainer}>
          <div className={cs.banner}>
            <span className={cs.emphasis}>{`${itemCount} ${subject.slice(
              0,
              -1
            )}${itemCount > 1 ? "s" : ""}`}</span>{" "}
            {`with location data.`}
          </div>
        </div>
      );
    }
  }
}

MapBanner.propTypes = {
  subject: PropTypes.string,
  itemCount: PropTypes.number,
  onClearFilters: PropTypes.func,
};

export default MapBanner;
