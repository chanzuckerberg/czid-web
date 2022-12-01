import React from "react";

import { withAnalytics } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { IconInfoSmall } from "~ui/icons";

import cs from "./map_banner.scss";

interface MapBannerProps {
  item?: string;
  itemCount?: number;
  onClearFilters?: $TSFixMeFunction;
}

class MapBanner extends React.Component<MapBannerProps> {
  render() {
    const { item, itemCount, onClearFilters } = this.props;
    if (!itemCount) {
      return (
        <div className={cs.bannerContainer}>
          <div className={cs.banner}>
            {`No ${item} with locations found. Try adjusting search or filters. `}
            <span
              className={cs.clearAll}
              onClick={withAnalytics(
                onClearFilters,
                "MapBanner_clear-filters-link_clicked",
                {
                  currentTab: item,
                },
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
            <span className={cs.emphasis}>{`${itemCount} ${item.slice(0, -1)}${
              itemCount > 1 ? "s" : ""
            }`}</span>{" "}
            {`with location data.`}
            <BasicPopup
              content={"Help out by adding more location data to your samples."}
              position="bottom left"
              size="mini"
              trigger={
                <span>
                  <IconInfoSmall className={cs.infoIcon} />
                </span>
              }
            />
          </div>
        </div>
      );
    }
  }
}

export default MapBanner;
