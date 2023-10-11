import React from "react";
import { Menu, Popup } from "semantic-ui-react";
import { useTrackEvent } from "~/api/analytics";
import { IconTableSmall, IconTreeSmall } from "~ui/icons";
import cs from "./report_view_selector.scss";

interface ReportViewSelectorProps {
  view?: "table" | "tree";
  onViewClick?: $TSFixMeFunction;
}

export const ReportViewSelector = ({
  view = "table",
  onViewClick,
}: ReportViewSelectorProps) => {
  const trackEvent = useTrackEvent();
  return (
    <div className={cs.reportViewSelector} data-testid={"report-view-selector"}>
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
    </div>
  );
};
