import cx from "classnames";
import { get, kebabCase } from "lodash/fp";
import React from "react";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import cs from "./field_list.scss";

interface FieldListProps {
  className?: string;
  fields: {
    label: string;
    value: React.ReactNode;
  }[];
}

const FieldList = ({ className, fields }: FieldListProps) => {
  return (
    <div className={cx(cs.fieldList, className)}>
      {fields.map(field => {
        const testId = kebabCase(field.label);
        const fieldMetadata = get("fieldMetadata", field);
        const fieldLabel = (
          <div data-testid={`${testId}-field-label`} className={cs.label}>
            {field.label}
          </div>
        );
        const labelWithTooltip = fieldMetadata && (
          <ColumnHeaderTooltip
            trigger={fieldLabel}
            title={field.label}
            content={fieldMetadata.tooltip}
            link={fieldMetadata.link}
          />
        );

        return (
          <div
            data-testid={`${testId}-fieldlist`}
            className={cs.field}
            key={field.label}
          >
            {labelWithTooltip || fieldLabel}
            <div data-testid={`${testId}-value`}>{field.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default FieldList;
