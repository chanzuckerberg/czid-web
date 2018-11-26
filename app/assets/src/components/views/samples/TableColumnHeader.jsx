import React from "react";
import cx from "classnames";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import PropTypes from "prop-types";
import cs from "./table_column_header.scss";
import BasicPopup from "~/components/BasicPopup";

class TableColumnHeader extends React.Component {
  render() {
    const {
      className,
      displayName,
      columnOptions,
      columnMap,
      onColumnOptionSelect,
      tooltip
    } = this.props;

    let trigger = (
      <div className={cx(className, cs.tableColumnHeader)}>{displayName}</div>
    );

    if (tooltip) {
      trigger = <BasicPopup trigger={trigger} content={tooltip} />;
    }

    // If there are no additional columns to show, return the trigger without the dropdown.
    if (!columnOptions || columnOptions.length === 0) {
      return trigger;
    }

    return (
      <BareDropdown trigger={trigger} floating scrolling>
        <BareDropdown.Menu>
          <BareDropdown.Header content="Switch Columns" className={cs.header} />
          {columnOptions.map(option => (
            <BareDropdown.Item
              key={columnMap[option].display_name}
              onClick={() => onColumnOptionSelect(option)}
            >
              {columnMap[option].display_name}
            </BareDropdown.Item>
          ))}
        </BareDropdown.Menu>
      </BareDropdown>
    );
  }
}

TableColumnHeader.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  columnOptions: PropTypes.arrayOf(PropTypes.string),
  columnMap: PropTypes.objectOf(
    PropTypes.shape({
      display_name: PropTypes.string.isRequired
    })
  ),
  onColumnOptionSelect: PropTypes.func
};

export default TableColumnHeader;
