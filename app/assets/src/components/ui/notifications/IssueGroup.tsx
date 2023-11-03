import cx from "classnames";
import { zipObject } from "lodash/fp";
import React from "react";
import Accordion from "~/components/layout/Accordion";
import DataTable from "~/components/visualizations/table/DataTable";
import { IconAlert, IconSuccess } from "~ui/icons";
import cs from "./issue_group.scss";

interface IssueGroupProps {
  caption?: string | React.ReactElement;
  className?: string;
  getColumnWidth?: $TSFixMeFunction;
  headers?: string[];
  initialOpen?: boolean;
  rows?: $TSFixMe[][];
  type?: "error" | "warning" | "info";
}

const IssueGroup = ({
  caption,
  className,
  getColumnWidth,
  headers,
  initialOpen,
  rows,
  type,
}: IssueGroupProps) => {
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
  const rowObject = rows.map(row => zipObject(headers, row));

  return (
    <Accordion
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      className={cx(cs.issueGroup, cs[type], className)}
      bottomContentPadding
      header={
        <div className={cs.header}>
          {type === "info" ? (
            <IconSuccess className={cx(cs.icon, cs[type])} />
          ) : (
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
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

export default IssueGroup;
