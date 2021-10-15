import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { PATHOGEN_LIST_V0_FEATURE } from "~/components/utils/features";
import BasicPopup from "../../BasicPopup";
import Label from "../../ui/labels/Label";
import { CATEGORIES } from "../../ui/labels/PathogenLabel";

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
        {tags.map(type => {
          return allowedFeatures.includes(PATHOGEN_LIST_V0_FEATURE) ? (
            <Label circular color="red" key={type} />
          ) : (
            <Label circular color={CATEGORIES[type]["color"]} key={type} />
          );
        })}
        <span className="pathogen-count">{totalCount}</span>
      </span>
    );
    return allowedFeatures.includes(PATHOGEN_LIST_V0_FEATURE) ? (
      <BasicPopup
        trigger={display}
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
