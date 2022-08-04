import React, { useContext } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import Label from "~/components/ui/labels/Label";
import { CATEGORIES } from "~/components/ui/labels/PathogenLabel";
import { PATHOGEN_LABEL_V0_FEATURE } from "~/components/utils/features";
import PropTypes from "~/components/utils/propTypes";

const PathogenPreview = ({ tag2Count }) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  let tags = Object.keys(tag2Count).sort();
  if (tags.length === 0) {
    return null;
  } else {
    let totalCount = Object.values(tag2Count).reduce((a, b) => a + b);
    let display = (
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
        <span className="pathogen-count">{totalCount}</span>
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

PathogenPreview.propTypes = {
  tag2Count: PropTypes.object,
};

export default PathogenPreview;
