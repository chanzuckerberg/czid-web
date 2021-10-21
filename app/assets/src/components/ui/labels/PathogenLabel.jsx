import PropTypes from "prop-types";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PATHOGEN_LIST_V0_FEATURE } from "~/components/utils/features";
import BasicPopup from "../../BasicPopup";
import Label from "./Label";

import cs from "./pathogen_label.scss";

const NIAID_URL =
  "https://www.niaid.nih.gov/research/emerging-infectious-diseases-pathogens";
const BASE_LABEL = "NIAID priority";

export const CATEGORIES = {
  categoryA: {
    text: BASE_LABEL + " | a",
    color: "red",
    tooltip: "NIAID pathogen priority list | category A",
    url: NIAID_URL,
  },
  categoryB: {
    text: BASE_LABEL + " | b",
    color: "orange",
    tooltip: "NIAID pathogen priority list | category B",
    url: NIAID_URL,
  },
  categoryC: {
    text: BASE_LABEL + " | c",
    color: "yellow",
    tooltip: "NIAID pathogen priority list | category C",
    url: NIAID_URL,
  },
};

const PathogenLabel = ({ type }) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  if (!CATEGORIES.hasOwnProperty(type)) {
    return null;
  }
  let label = allowedFeatures.includes(PATHOGEN_LIST_V0_FEATURE) ? (
    <a>
      <Label
        text="Known Pathogen"
        color="red"
        size="medium"
        className={cs.newPathogenLabel}
      />
    </a>
  ) : (
    <a href={CATEGORIES[type]["url"]} target="_blank" rel="noopener noreferrer">
      <Label
        text={CATEGORIES[type]["text"]}
        color={CATEGORIES[type]["color"]}
        size="medium"
        className={cs.pathogenLabel}
      />
    </a>
  );
  return allowedFeatures.includes(PATHOGEN_LIST_V0_FEATURE) ? (
    <BasicPopup
      trigger={label}
      content={
        <>
          {"Organism with known human pathogenicity. See the "}
          <ExternalLink
            href={"/pathogen_list"}
            analyticsEventName={`PathogenLabel_pathogen-list-link_clicked`}
          >
            full list
          </ExternalLink>
          {" of pathogens."}
        </>
      }
      basic={false}
      hoverable={true}
      inverted={false}
      position="top center"
    />
  ) : (
    <BasicPopup
      trigger={label}
      content={CATEGORIES[type]["tooltip"]}
      basic={false}
    />
  );
};

PathogenLabel.propTypes = {
  type: PropTypes.string,
};

export default PathogenLabel;
