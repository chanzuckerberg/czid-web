import { ButtonIcon } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import BasicPopup from "~/components/common/BasicPopup";
import Label from "~ui/labels/Label";
import cs from "./filter_button_with_counter.scss";

interface FilterButtonWithCounterProps {
  filterCounter: number;
  onFilterToggle: () => void;
  showFilters: boolean;
  isDisabled?: boolean;
  popupDisabledSubtitle?: string;
  popupPosition?: "top left" | "bottom center";
}

export const FilterButtonWithCounter = ({
  isDisabled = false,
  filterCounter = 0,
  onFilterToggle,
  showFilters,
  popupDisabledSubtitle = "Not available",
  popupPosition,
}: FilterButtonWithCounterProps) => {
  return (
    <div
      className={cx(cs.filtersTrigger, isDisabled && cs.disabled)}
      onClick={isDisabled ? undefined : onFilterToggle}
    >
      <BasicPopup
        trigger={
          <div>
            <ButtonIcon
              sdsSize="large"
              sdsType="primary"
              sdsIcon="slidersHorizontal"
              on={showFilters}
              disabled={isDisabled}
            />
            {!isDisabled && (
              <Label
                className={cs.filtersCounter}
                circular
                text={filterCounter}
              />
            )}
          </div>
        }
        content={
          isDisabled ? (
            <h1 className={cs.popupText}>
              Filters
              <h2 className={cs.popupSubtitle}>{popupDisabledSubtitle}</h2>
            </h1>
          ) : (
            "Filters"
          )
        }
        basic={false}
        mouseEnterDelay={600}
        mouseLeaveDelay={200}
        position={popupPosition || (isDisabled ? "top left" : "bottom center")}
      />
    </div>
  );
};
