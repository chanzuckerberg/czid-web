import cx from "classnames";
import { filter } from "lodash";
import React from "react";
import { Popup } from "semantic-ui-react";
import BareDropdown from "../../ui/controls/dropdowns/BareDropdown";
import cs from "./view_header.scss";

interface TitleProps {
  children?: React.ReactNode;
  options?: {
    label: string;
    id: number | string;
    onClick: $TSFixMeFunction;
  }[];
  label: string;
  id?: string | number;
}

class Title extends React.Component<TitleProps> {
  _nameContainer: any;
  _name: any;
  state = {
    nameOverflows: false,
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
        nameOverflows,
      });
    }
  };

  render() {
    const { options, label, id } = this.props;
    const { nameOverflows } = this.state;
    const multipleOptions = options && options.length > 1;

    let sampleName = (
      <h1
        ref={c => (this._nameContainer = c)}
        className={cx(cs.sampleName, multipleOptions && cs.trigger)}
      >
        <span ref={c => (this._name = c)}>{label}</span>
      </h1>
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
        option => String(option.id) !== String(id),
      );

      const items = filteredOptions.map(option => (
        <BareDropdown.Item onClick={option.onClick} key={option.id}>
          {option.label}
        </BareDropdown.Item>
      ));

      return (
        <BareDropdown
          trigger={sampleName}
          className={cs.sampleDropdown}
          floating
          items={items}
          data-testid="view-header-dropdown"
        />
      );
    } else {
      return sampleName;
    }
  }
}

export default Title;
