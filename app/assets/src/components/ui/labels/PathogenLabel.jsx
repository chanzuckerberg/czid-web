import Label from "./Label";
import BasicPopup from "../../BasicPopup";
import React from "react";
import cs from "./pathogen_label.scss";

const NIAID_URL =
  "https://www.niaid.nih.gov/research/emerging-infectious-diseases-pathogens";
const BASE_LABEL = "NIAID priority";

export const CATEGORIES = {
  categoryA: {
    text: BASE_LABEL + " | a",
    color: "red",
    tooltip: "NIAID pathogen priority list | category A",
    url: NIAID_URL
  },
  categoryB: {
    text: BASE_LABEL + " | b",
    color: "orange",
    tooltip: "NIAID pathogen priority list | category B",
    url: NIAID_URL
  },
  categoryC: {
    text: BASE_LABEL + " | c",
    color: "yellow",
    tooltip: "NIAID pathogen priority list | category C",
    url: NIAID_URL
  }
};

const PathogenLabel = ({ type }) => {
  if (!CATEGORIES.hasOwnProperty(type)) {
    return null;
  }
  let label = (
    <a href={CATEGORIES[type]["url"]} target="_blank" rel="noopener noreferrer">
      <Label
        text={CATEGORIES[type]["text"]}
        color={CATEGORIES[type]["color"]}
        size="medium"
        className={cs.pathogenLabel}
      />
    </a>
  );
  return <BasicPopup trigger={label} content={CATEGORIES[type]["tooltip"]} />;
};

export default PathogenLabel;
