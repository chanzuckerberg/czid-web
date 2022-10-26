import React, { useContext } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import Label from "~/components/ui/labels/Label";
import { CATEGORIES } from "~/components/ui/labels/PathogenLabel";
import { PATHOGEN_LABEL_V0_FEATURE } from "~/components/utils/features";

interface PathogenPreviewProps {
  tag2Count?: object;
  totalPathogenCount?: number;
}

const PathogenPreview = ({
  tag2Count,
  totalPathogenCount,
}: PathogenPreviewProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const tags = Object.keys(tag2Count).sort();
  if (tags.length === 0) {
    return null;
  } else {
    const display = (
      <span className="idseq-ui pathogen-preview">
        {allowedFeatures.includes(PATHOGEN_LABEL_V0_FEATURE) ? (
          <Label circular color="red" />
        ) : (
          tags.map(type => {
            return (
              <Label circular color={CATEGORIES[type]["color"]} key={type} />
            );
          })
        )}
        <span className="pathogen-count">{totalPathogenCount}</span>
      </span>
    );
    return allowedFeatures.includes(PATHOGEN_LABEL_V0_FEATURE) ? (
      <BasicPopup
        className="pathogen-preview-popup"
        trigger={React.cloneElement(display, {
          onMouseEnter: () =>
            trackEvent(ANALYTICS_EVENT_NAMES.PATHOGEN_PREVIEW_HOVERED),
        })}
        content="Contains flagged pathogen species."
        basic={false}
        inverted={false}
        position="top center"
      />
    ) : (
      <BasicPopup
        trigger={display}
        content="Contains flagged pathogen species"
        basic={false}
      />
    );
  }
};

export default PathogenPreview;
