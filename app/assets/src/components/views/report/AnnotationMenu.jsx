import { Menu, MenuItem } from "czifui";
import PropTypes from "prop-types";
import React, { useState } from "react";

import {
  logAnalyticsEvent,
  withAnalytics,
  ANALYTICS_EVENT_NAMES,
} from "~/api/analytics";
import AnnotationLabel from "~/components/ui/labels/AnnotationLabel";
import {
  ANNOTATION_HIT,
  ANNOTATION_NOT_A_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NONE,
} from "../SampleView/constants";

import cs from "./annotation_menu.scss";

const AnnotationMenu = ({
  currentLabelType,
  onAnnotationSelected,
  analyticsContext,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onItemSelected = annotationType => {
    onAnnotationSelected(annotationType);
    handleClose();
    logAnalyticsEvent(ANALYTICS_EVENT_NAMES.ANNOTATION_MENU_MENU_ITEM_CLICKED, {
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
        onClose={handleClose}
        getContentAnchorEl={null}
      >
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_HIT)}
        >
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_HIT}
            isSmall={true}
            hideTooltip={true}
          />
          Hit
        </MenuItem>
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_NOT_A_HIT)}
        >
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_NOT_A_HIT}
            isSmall={true}
            hideTooltip={true}
          />
          Not a hit
        </MenuItem>
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_INCONCLUSIVE)}
        >
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_INCONCLUSIVE}
            isSmall={true}
            hideTooltip={true}
          />
          Inconclusive
        </MenuItem>
        {/* "None" annotations are stored as null on the backend. */}
        <MenuItem className={cs.menuItem} onClick={() => onItemSelected(null)}>
          <AnnotationLabel
            className={cs.labelContainer}
            type={ANNOTATION_NONE}
            isSmall={true}
            hideTooltip={true}
          />
          None
        </MenuItem>
      </Menu>
    </>
  );
};

AnnotationMenu.propTypes = {
  currentLabelType: PropTypes.oneOf([
    ANNOTATION_HIT,
    ANNOTATION_NOT_A_HIT,
    ANNOTATION_INCONCLUSIVE,
    ANNOTATION_NONE,
  ]),
  onAnnotationSelected: PropTypes.func,
  analyticsContext: PropTypes.object,
};

export default AnnotationMenu;
