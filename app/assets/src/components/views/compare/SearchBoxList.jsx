import React from "react";
import PropTypes from "prop-types";
import { Menu, Input } from "semantic-ui-react";

class SearchBoxList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: new Set(this.props.selected)
    };
  }

  render() {
    return (
      <Menu vertical>
        <Menu.Item>
          <Input icon="search" placeholder="Search metadata" />
        </Menu.Item>
        {this.props.options.map(option => {
          <Menu.Item
            name={option.value}
            active={option.value in this.state.selected}
          >
            {option.label}
          </Menu.Item>;
        })}
      </Menu>
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
