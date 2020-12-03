import React from "react";
import PropTypes from "prop-types";
import { Menu, Popup } from "semantic-ui-react";
import { IconTableSmall, IconTreeSmall } from "~ui/icons";

const ReportViewSelector = ({ view, onViewClick }) => {
  return (
    <Menu icon floated="right">
      <Popup
        trigger={
          <Menu.Item
            name="table"
            active={view === "table"}
            onClick={() => onViewClick({ view: "table" })}
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
            onClick={() => onViewClick({ view: "tree" })}
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

ReportViewSelector.defaultProps = {
  view: "table",
};

ReportViewSelector.propTypes = {
  view: PropTypes.oneOf(["table", "tree"]),
  onViewClick: PropTypes.func,
};

export default ReportViewSelector;
