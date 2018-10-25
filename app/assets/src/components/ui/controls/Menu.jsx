import { Menu as BaseMenu } from "semantic-ui-react";
import PropTypes from "prop-types";
import React from "react";

class Menu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <BaseMenu className="idseq-ui" {...this.props}>
        {this.props.children}
      </BaseMenu>
    );
  }
}

Menu.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

class MenuItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <BaseMenu.Item className="idseq-ui" {...this.props}>
        {this.props.children}
      </BaseMenu.Item>
    );
  }
}

MenuItem.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export { Menu, MenuItem };
