import React from "react";
import PropTypes from "prop-types";
import { Input } from "semantic-ui-react";

class SearchBoxList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: new Set(this.props.selected)
    };
  }

  render() {
    return (
      <div>
        <div>
          <Input placeholder="Search" onChange={this.handleFilterChange} />
        </div>
        <div>
          {this.props.options.map(option => {
            <div
              active={option.value in this.state.selected}
              onClick={() => this.handleSelectionOption(option.value)}
            >
              {option.label}
            </div>;
          })}
        </div>
      </div>
    );
  }
}

SearchBoxList.defaultProps = {
  selected: []
};

SearchBoxList.propTypes = {
  options: PropTypes.array,
  selected: PropTypes.array,
  onChange: PropTypes.func
};

export default SearchBoxList;
