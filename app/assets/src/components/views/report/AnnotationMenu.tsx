import { Menu, MenuItem } from "czifui";
import React, { useState } from "react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import AnnotationLabel from "~/components/ui/labels/AnnotationLabel";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NONE,
  ANNOTATION_NOT_A_HIT,
} from "../SampleView/constants";
import cs from "./annotation_menu.scss";

interface AnnotationMenuProps {
  currentLabelType?: "hit" | "not_a_hit" | "inconclusive" | "none";
  onAnnotationSelected?: $TSFixMeFunction;
  analyticsContext?: object;
}

const AnnotationMenu = ({
  currentLabelType,
  onAnnotationSelected,
  analyticsContext,
}: AnnotationMenuProps) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event: $TSFixMe) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onItemSelected = (annotationType: $TSFixMe) => {
    onAnnotationSelected(annotationType);
    handleClose();
    trackEvent(ANALYTICS_EVENT_NAMES.ANNOTATION_MENU_MENU_ITEM_CLICKED, {
      ...analyticsContext,
      annotationType: annotationType,
    });
  };

  return (
    <>
      <AnnotationLabel
        type={currentLabelType}
        onClick={withAnalytics(
          handleClick,
          ANALYTICS_EVENT_NAMES.REPORT_TABLE_ANNOTATION_MENU_OPENED,
          analyticsContext,
        )}
      />
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: "left",
          vertical: "bottom",
        }}
        transformOrigin={{
          horizontal: "left",
          vertical: "top",
        }}
        keepMounted
        open={!!anchorEl}
        onClose={handleClose}>
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_HIT)}>
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_HIT}
            isStatic={true}
            hideTooltip={true}
          />
          Hit
        </MenuItem>
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_NOT_A_HIT)}>
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_NOT_A_HIT}
            isStatic={true}
            hideTooltip={true}
          />
          Not a hit
        </MenuItem>
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_INCONCLUSIVE)}>
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_INCONCLUSIVE}
            isStatic={true}
            hideTooltip={true}
          />
          Inconclusive
        </MenuItem>
        {/* "None" annotations are stored as null on the backend. */}
        <MenuItem className={cs.menuItem} onClick={() => onItemSelected(null)}>
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_NONE}
            isStatic={true}
            hideTooltip={true}
          />
          None
        </MenuItem>
      </Menu>
    </>
  );
};

export default AnnotationMenu;
