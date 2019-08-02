import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { zipObject } from "lodash/fp";

import Accordion from "~/components/layout/Accordion";
import DataTable from "~/components/visualizations/table/DataTable";
import AlertIcon from "~ui/icons/AlertIcon";
import CircleCheckmarkIcon from "~ui/icons/CircleCheckmarkIcon";

import cs from "./issue_group.scss";

class IssueGroup extends React.Component {
  render() {
    const { initialOpen, type } = this.props;

    const rowObject = this.props.rows.map(row =>
      zipObject(this.props.headers, row)
    );

    return (
      <Accordion
        className={cx(cs.issueGroup, cs[this.props.type], this.props.className)}
        bottomContentPadding
        header={
          <div className={cs.header}>
            {type === "info" ? (
              <CircleCheckmarkIcon
                className={cx(cs.icon, cs[this.props.type])}
              />
            ) : (
              <AlertIcon className={cx(cs.icon, cs[this.props.type])} />
            )}
            {this.props.caption}
          </div>
        }
        open={initialOpen}
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
  caption: PropTypes.string,
  className: PropTypes.string,
  headers: PropTypes.arrayOf(PropTypes.string),
  initialOpen: PropTypes.bool,
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)),
  type: PropTypes.oneOf(["error", "warning", "info"]),
};

export default IssueGroup;
