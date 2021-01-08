import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./field_list.scss";

const FieldList = ({ className, fields }) => {
  return (
    <div className={cx(cs.fieldList, className)}>
      {fields.map(field => (
        <div className={cs.field} key={field.label}>
          <div className={cs.label}>{field.label}</div>
          {field.value}
        </div>
      ))}
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
