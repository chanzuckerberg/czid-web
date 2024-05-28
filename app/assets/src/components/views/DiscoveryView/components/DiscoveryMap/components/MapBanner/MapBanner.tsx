import { Icon } from "@czi-sds/components";
import React from "react";
import BasicPopup from "~/components/common/BasicPopup";
import { GlobalContext } from "~/globalContext/reducer";
import cs from "./map_banner.scss";

interface MapBannerProps {
  item?: string;
  itemCount?: number;
  onClearFilters?: $TSFixMeFunction;
}

class MapBanner extends React.Component<MapBannerProps> {
  static contextType = GlobalContext;
  render() {
    const { item, itemCount, onClearFilters } = this.props;

    if (!itemCount) {
      return (
        <div className={cs.bannerContainer}>
          <div className={cs.banner}>
            {`No ${item} with locations found. Try adjusting search or filters. `}
            <span className={cs.clearAll} onClick={onClearFilters}>
              Clear all
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className={cs.bannerContainer}>
          <div className={cs.banner}>
            {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532 */}
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
                  <Icon
                    sdsIcon="infoCircle"
                    sdsSize="s"
                    sdsType="interactive"
                    className={cs.infoIcon}
                  />
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
