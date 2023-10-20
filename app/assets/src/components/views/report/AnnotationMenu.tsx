import { Menu, MenuItem } from "@czi-sds/components";
import React, { useState } from "react";
import {
  ANALYTICS_EVENT_NAMES,
  useTrackEvent,
  useWithAnalytics,
} from "~/api/analytics";
import { createAnnotation } from "~/api/blast";
import AnnotationLabel from "~/components/ui/labels/AnnotationLabel";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NONE,
  ANNOTATION_NOT_A_HIT,
} from "~/components/views/SampleView/utils";
import { AnnotationType } from "~/interface/shared";
import cs from "./annotation_menu.scss";

interface AnnotationMenuProps {
  onAnnotationUpdate: () => void;
  pipelineRunId: number;
  taxonId: number;
  currentLabelType?: "hit" | "not_a_hit" | "inconclusive" | "none";
  analyticsContext?: object;
}

const AnnotationMenu = ({
  onAnnotationUpdate,
  pipelineRunId,
  taxonId,
  currentLabelType,
  analyticsContext,
}: AnnotationMenuProps) => {
  const trackEvent = useTrackEvent();
  const withAnalytics = useWithAnalytics();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event: $TSFixMe) => {
    withAnalytics(
      ANALYTICS_EVENT_NAMES.REPORT_TABLE_ANNOTATION_MENU_OPENED,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
      analyticsContext,
    );
    withAnalytics(
      ANALYTICS_EVENT_NAMES.REPORT_TABLE_ANNOTATION_MENU_OPENED_ALLISON_TESTING,
      JSON.stringify(analyticsContext),
    );
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAnnotationCreation = (annotationType: AnnotationType) => {
    createAnnotation({
      pipelineRunId,
      taxId: taxonId,
      annotationType,
    }).then(() => {
      onAnnotationUpdate();
    });
  };

  const onItemSelected = (annotationType: $TSFixMe) => {
    handleAnnotationCreation(annotationType);
    handleClose();
    trackEvent(ANALYTICS_EVENT_NAMES.ANNOTATION_MENU_MENU_ITEM_CLICKED, {
      ...analyticsContext,
      annotationType: annotationType,
    });
  };

  return (
    <>
      <AnnotationLabel type={currentLabelType} onClick={handleClick} />
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
      >
        <MenuItem
          className={cs.menuItem}
          onClick={() => onItemSelected(ANNOTATION_HIT)}
        >
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
          onClick={() => onItemSelected(ANNOTATION_NOT_A_HIT)}
        >
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
          onClick={() => onItemSelected(ANNOTATION_INCONCLUSIVE)}
        >
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
