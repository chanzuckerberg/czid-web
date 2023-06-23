import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import Link from "~/components/ui/controls/Link";
import Label from "~/components/ui/labels/Label";
import { CATEGORIES } from "~/components/ui/labels/PathogenLabel";

interface PathogenPreviewProps {
  tag2Count?: object;
}

const PathogenPreview = ({ tag2Count }: PathogenPreviewProps) => {
  const tags = Object.keys(tag2Count).sort();
  if (tags.length === 0) {
    return null;
  } else {
    const display = (
      <span className="idseq-ui pathogen-preview">
        {tags.map(type => {
          if (tag2Count[type] > 0) {
            return (
              <span key={type}>
                <Label circular color={CATEGORIES[type]["color"]} />
                <span className="pathogen-count">{tag2Count[type]}</span>
              </span>
            );
          }
        })}
      </span>
    );
    return (
      <BasicPopup
        className="pathogen-preview-popup"
        trigger={React.cloneElement(display, {
          onMouseEnter: () =>
            trackEvent(ANALYTICS_EVENT_NAMES.PATHOGEN_PREVIEW_HOVERED),
        })}
        content={
          <span>
            Contains species with known human pathogenicity based on{" "}
            <Link external href="/pathogen_list">
              CZ ID&#39;s current pathogen list.
            </Link>{" "}
            <br />
            <br />
            Please cross-reference the literature to verify tagged pathogens.
          </span>
        }
        basic={false}
        inverted={false}
        position="top center"
      />
    );
  }
};

export default PathogenPreview;
