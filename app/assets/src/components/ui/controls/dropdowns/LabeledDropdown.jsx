import React from "react";
import PropTypes from "prop-types";
import MultipleDropdown from "./MultipleDropdown";
import { find, keyBy, map } from "lodash/fp";
import cs from "./labeled_dropdown.scss";

class LabeledDropdown extends React.Component {
  // This dropdown component manages a multiple dropdown and
  // a list of tags displayed below.

  constructor(props) {
    super(props);

    this.state = {
      labels: this.getLabels()
    };
  }

  handleSelectionChange = selectedOptions => {
    const { children } = this.props;

    this.setState({ labels: this.getLabels(selectedOptions) });
    console.log("handleSelectionChange in the wrapper", selectedOptions);
    children.props.onChange(selectedOptions);
  };

  getLabels = () => {
    // const options = this.props.children.props.options;
    // const optionsByValue = keyBy('value', options);
    // return map(option => optionsByValue[option], value);
  };

  render() {
    const { children } = this.props;
    console.log(children);
    console.log(children.props);
    const wrappedChildren = React.cloneElement(children, {
      onChange: this.handleSelectionChange
    });
    return (
      <div>
        {wrappedChildren}

        {/* <div className={cs.labelList}>
          {this.getLabels().map(option => (
            <div key={`label-${option}`}>
              {find(this.props.options)({value: option})}
            </div>
          ))}
        </div> */}
      </div>
    );
  }
}

LabeledDropdown.propTypes = {
  children: PropTypes.shape({
    props: PropTypes.shape({
      onChange: PropTypes.func,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          value: PropTypes.string
        })
      )
      // value
    })
  })
  // children: PropTypes.oneOfType([
  //   PropTypes.instanceOf(MultipleDropdown)
  // ])
};

export default LabeledDropdown;
