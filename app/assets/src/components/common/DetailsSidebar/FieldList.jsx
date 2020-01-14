import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import cs from "./field_list.scss";

export default class FieldList extends React.Component {
  render() {
    return (
      <div className={cx(cs.fieldList, this.props.className)}>
        {this.props.fields.map(field => (
          <div className={cs.field} key={field.label}>
            <div className={cs.label}>{field.label}</div>
            {field.value}
          </div>
        ))}
      </div>
    );
  }
}

FieldList.propTypes = {
  className: PropTypes.string,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.node,
    })
  ),
};
