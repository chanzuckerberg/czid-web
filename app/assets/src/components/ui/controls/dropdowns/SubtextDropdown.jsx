import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import Dropdown from "./Dropdown";

import cs from "./subtext_dropdown.scss";

class SubtextDropdown extends React.Component {
  renderMenuItem(option) {
    const trigger = (
      <BareDropdown.Item
        onClick={e => {
          if (option.disabled) {
            e.stopPropagation();
          }
        }}
        className={cx(cs.option, option.disabled && cs.disabledOption)}
      >
        <div className={cs.optionText}>{option.text}</div>
        <div className={cs.optionSubtext}>{option.subtext}</div>
      </BareDropdown.Item>
    );
    if (option.tooltip) {
      return (
        <ColumnHeaderTooltip
          trigger={trigger}
          content={option.tooltip}
          position="top center"
          mouseEnterDelay={600}
        />
      );
    } else {
      return trigger;
    }
  }

  renderMenuItems() {
    const { options } = this.props;

    const dropdownOptions = options.map(option => ({
      text: option.text,
      value: option.value,
      subtext: option.subtext,
      customNode: option.customNode
        ? option.customNode
        : this.renderMenuItem(option),
    }));
    return dropdownOptions;
  }

  render() {
    const renderedMenuItems = this.renderMenuItems();
    const {
      className,
      initialSelectedValue,
      menuClassName,
      onChange,
      ...props
    } = this.props;

    return (
      <Dropdown
        {...props}
        className={className}
        menuClassName={menuClassName}
        options={renderedMenuItems}
        value={initialSelectedValue}
        onChange={onChange}
      />
    );
  }
}

SubtextDropdown.propTypes = {
  className: PropTypes.string,
  menuClassName: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      text: PropTypes.string.isRequired,
      subtext: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      tooltip: PropTypes.string,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  initialSelectedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

export default SubtextDropdown;
