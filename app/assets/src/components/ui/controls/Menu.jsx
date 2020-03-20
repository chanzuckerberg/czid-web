import { Menu as BaseMenu } from "semantic-ui-react";
import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";

class Menu extends React.Component {
  render() {
    const { className } = this.props;
    return (
      <BaseMenu className={cx("idseq-ui", className)} {...this.props}>
        {this.props.children}
      </BaseMenu>
    );
  }
}

Menu.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

class MenuItem extends React.Component {
  render() {
    const { className } = this.props;
    return (
      <BaseMenu.Item className={cx("idseq-ui", className)} {...this.props}>
        {this.props.children}
      </BaseMenu.Item>
    );
  }
}

MenuItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export { Menu, MenuItem };
