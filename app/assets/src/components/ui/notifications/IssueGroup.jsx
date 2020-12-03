import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { zipObject } from "lodash/fp";

import Accordion from "~/components/layout/Accordion";
import DataTable from "~/components/visualizations/table/DataTable";
import { IconAlert, IconSuccess } from "~ui/icons";

import cs from "./issue_group.scss";

const IssueGroup = ({
  caption,
  className,
  getColumnWidth,
  headers,
  initialOpen,
  rows,
  type,
}) => {
  const rowObject = rows.map(row => zipObject(headers, row));

  return (
    <Accordion
      className={cx(cs.issueGroup, cs[type], className)}
      bottomContentPadding
      header={
        <div className={cs.header}>
          {type === "info" ? (
            <IconSuccess className={cx(cs.icon, cs[type])} />
          ) : (
            <IconAlert className={cx(cs.icon, cs[type])} />
          )}
          {caption}
        </div>
      }
      open={initialOpen}
    >
      <div className={cs.tableContainer}>
        <DataTable
          columns={headers}
          data={rowObject}
          getColumnWidth={getColumnWidth}
          striped={false}
        />
      </div>
    </Accordion>
  );
};

IssueGroup.propTypes = {
  caption: PropTypes.string,
  className: PropTypes.string,
  getColumnWidth: PropTypes.func,
  headers: PropTypes.arrayOf(PropTypes.string),
  initialOpen: PropTypes.bool,
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)),
  type: PropTypes.oneOf(["error", "warning", "info"]),
};

export default IssueGroup;
