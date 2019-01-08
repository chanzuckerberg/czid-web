import React from "react";
import PropTypes from "prop-types";
import Input from "~ui/controls/Input";
import HelpIcon from "~ui/containers/HelpIcon";
import cs from "./min_contig_size_filter.scss";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import DropdownTrigger from "../../../ui/controls/dropdowns/common/DropdownTrigger";

class MinContigSizeFilter extends React.Component {
  state = {
    value: this.props.value,
    previousValue: this.props.value
  };

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value,
        previousValue: this.props.value
      });
    }
  }

  handleChange = value => {
    this.setState({ value });
  };

  handleBlur = () => {
    const newValue = Number(this.state.value);

    if (isNaN(newValue)) {
      // Reset back to the previous value.
      this.setState({
        value: this.state.previousValue
      });
    } else {
      if (this.props.onChange) {
        this.props.onChange(newValue);
      }
    }
  };

  renderContents = () => {
    const helpText = `
      The contig and contig r columns will ignore contigs less than the Min Contig Size.
      For example, if a single contig with 10 reads is assembled for a taxon but the Min Contig Size
      is larger than 10, then contig and contig r will show 0 for that taxon.
    `;

    return (
      <div className={cs.contents}>
        <div className={cs.labelContainer}>
          <span className={cs.label}>Set the Min Contig Size:</span>
          <HelpIcon text={helpText} />
        </div>
        <Input
          value={this.state.value}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          type="number"
          className={cs.input}
        />
      </div>
    );
  };

  render() {
    return (
      <BareDropdown
        className={cs.minContigSizeFilter}
        trigger={
          <DropdownTrigger
            className={cs.dropdownTrigger}
            label="Min Contig Size:"
            value={this.state.value}
            rounded
          />
        }
        floating
        arrowInsideTrigger
        closeOnClick={false}
      >
        {this.renderContents()}
      </BareDropdown>
    );
  }
}

MinContigSizeFilter.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func
};

export default MinContigSizeFilter;
