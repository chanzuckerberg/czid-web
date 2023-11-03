import React from "react";
import { Menu, Popup } from "semantic-ui-react";
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
  return (
    <div className={cs.reportViewSelector} data-testid={"report-view-selector"}>
      <Menu icon floated="right">
        <Popup
          trigger={
            <Menu.Item
              name="table"
              active={view === "table"}
              onClick={() => {
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
                onViewClick({ view: "table" });
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
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
                onViewClick({ view: "tree" });
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
