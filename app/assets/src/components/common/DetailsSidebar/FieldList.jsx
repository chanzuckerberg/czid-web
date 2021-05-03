import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { get } from "lodash/fp";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";

import cs from "./field_list.scss";

const FieldList = ({ className, fields }) => {
  return (
    <div className={cx(cs.fieldList, className)}>
      {fields.map(field => {
        const fieldMetadata = get("fieldMetadata", field);
        const fieldLabel = <div className={cs.label}>{field.label}</div>;
        const labelWithTooltip = fieldMetadata && (
          <ColumnHeaderTooltip
            trigger={fieldLabel}
            title={field.label}
            content={fieldMetadata.tooltip}
            link={fieldMetadata.link}
          />
        );

        return (
          <div className={cs.field} key={field.label}>
            {labelWithTooltip || fieldLabel}
            {field.value}
          </div>
        );
      })}
    </div>
  );
};

FieldList.propTypes = {
  className: PropTypes.string,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.node,
    })
  ),
};

export default FieldList;
