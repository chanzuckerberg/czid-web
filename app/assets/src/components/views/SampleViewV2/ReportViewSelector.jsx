import React from "react";
import PropTypes from "prop-types";
import { Menu, Icon, Popup } from "semantic-ui-react";

import cs from "./report_view_selector.scss";

const ReportViewSelector = ({ view, onViewClick }) => {
  return (
    <Menu icon floated="right" className={cs.tableTreeSelector}>
      <Popup
        trigger={
          <Menu.Item
            name="table"
            active={view === "table"}
            onClick={() => onViewClick({ view: "tree" })}
          >
            <Icon name="table" />
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
            <Icon name="fork" />
          </Menu.Item>
        }
        content={<div>Taxonomic Tree View</div>}
        inverted
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
