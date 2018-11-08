import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { filter } from "lodash";
import BareDropdown from "../../ui/controls/dropdowns/BareDropdown";
import { Popup } from "semantic-ui-react";
import cs from "./view_header.scss";

class Title extends React.Component {
  state = {
    nameOverflows: false
  };

  componentDidMount() {
    this.checkNameOverflows();
  }

  componentDidUpdate() {
    this.checkNameOverflows();
  }

  // TODO(mark): This text name overflow + popup behavior may be useful in many places.
  // Refactor into standalone component.
  checkNameOverflows = () => {
    const nameOverflows =
      this._nameContainer &&
      this._name &&
      this._name.getBoundingClientRect().width >
        this._nameContainer.getBoundingClientRect().width;

    // If-statement prevents infinite loop
    if (this.state.nameOverflows !== nameOverflows) {
      this.setState({
        nameOverflows
      });
    }
  };

  render() {
    const { options, label, id } = this.props;
    const { nameOverflows } = this.state;
    const multipleOptions = options && options.length > 1;

    let sampleName = (
      <div
        ref={c => (this._nameContainer = c)}
        className={cx(cs.sampleName, multipleOptions && cs.trigger)}
      >
        <span ref={c => (this._name = c)}>{label}</span>
      </div>
    );

    // if the name overflows, show the full name in a popup.
    if (nameOverflows) {
      sampleName = (
        <Popup
          trigger={sampleName}
          content={label}
          inverted
          on="hover"
          className={cs.sampleNamePopup}
        />
      );
    }

    if (multipleOptions) {
      const filteredOptions = filter(
        options,
        option => String(option.id) !== String(id)
      );
      return (
        <BareDropdown
          trigger={sampleName}
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
      return sampleName;
    }
  }
}

Title.propTypes = {
  children: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      onClick: PropTypes.func.isRequired
    })
  ),
  label: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default Title;
