import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { zipObject } from "lodash/fp";

import Accordion from "~/components/layout/Accordion";
import DataTable from "~/components/visualizations/table/DataTable";
import AlertIcon from "~ui/icons/AlertIcon";

import cs from "./issue_group.scss";

class IssueGroup extends React.Component {
  render() {
    const rowObject = this.props.rows.map(row =>
      zipObject(this.props.headers, row)
    );

    return (
      <Accordion
        className={cx(cs.issueGroup, cs[this.props.type], this.props.className)}
        header={
          <div className={cs.header}>
            <AlertIcon className={cx(cs.icon, cs[this.props.type])} />
            {this.props.caption}
          </div>
        }
      >
        <div className={cs.tableContainer}>
          <DataTable
            columns={this.props.headers}
            data={rowObject}
            striped={false}
          />
        </div>
      </Accordion>
    );
  }
}

IssueGroup.propTypes = {
  className: PropTypes.string,
  caption: PropTypes.string,
  headers: PropTypes.arrayOf(PropTypes.string),
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)),
  type: PropTypes.oneOf(["error", "warning"])
};

export default IssueGroup;
