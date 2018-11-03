import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { filter } from "lodash";
import BareDropdown from "../../ui/controls/dropdowns/BareDropdown";
import cs from "./view_header.scss";

class Title extends React.Component {
  render() {
    const { options, label, id } = this.props;
    if (options && options.length > 1) {
      const filteredOptions = filter(options, option => option.id !== id);

      return (
        <BareDropdown
          trigger={
            <span className={cx(cs.sampleName, cs.trigger)}>{label}</span>
          }
          className={cs.sampleDropdown}
          floating
          scrolling
        >
          <BareDropdown.Menu>
            {filteredOptions.map(option => (
              <BareDropdown.Item onClick={option.onClick} key={option.id}>
                {option.label}
              </BareDropdown.Item>
            ))}
          </BareDropdown.Menu>
        </BareDropdown>
      );
    } else {
      return <div className={cs.sampleName}>{label}</div>;
    }
  }
}

Title.propTypes = {
  children: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      id: PropTypes.string,
      onClick: PropTypes.func.isRequired
    })
  ),
  label: PropTypes.string,
  id: PropTypes.string
};

export default Title;
