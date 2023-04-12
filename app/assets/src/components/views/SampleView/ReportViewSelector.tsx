import React from "react";
import { Menu, Popup } from "semantic-ui-react";
import { trackEvent } from "~/api/analytics";
import { IconTableSmall, IconTreeSmall } from "~ui/icons";

interface ReportViewSelectorProps {
  view?: "table" | "tree";
  onViewClick?: $TSFixMeFunction;
}

const ReportViewSelector = ({
  view = "table",
  onViewClick,
}: ReportViewSelectorProps) => {
  return (
    <Menu icon floated="right">
      <Popup
        trigger={
          <Menu.Item
            name="table"
            active={view === "table"}
            onClick={() => {
              onViewClick({ view: "table" });
              trackEvent("ReportViewSelector_table-view_selected");
            }}
          >
            <IconTableSmall />
          </Menu.Item>
        }
        content="Table View"
        inverted
      />

      <Popup
        trigger={
          <Menu.Item
            name="tree"
            active={view === "tree"}
            onClick={() => {
              onViewClick({ view: "tree" });
              trackEvent("ReportViewSelector_taxonomic-tree-view_selected");
            }}
          >
            <IconTreeSmall />
          </Menu.Item>
        }
        content={<div>Taxonomic Tree View</div>}
        inverted
        position="top right"
      />
    </Menu>
  );
};

export default ReportViewSelector;
