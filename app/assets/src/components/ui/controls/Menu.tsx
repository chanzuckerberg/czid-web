import cx from "classnames";
import React from "react";
import {
  Menu as BaseMenu,
  MenuProps as BaseMenuProps,
} from "semantic-ui-react";

interface MenuProps extends BaseMenuProps {
  className?: string;
  children?: React.ReactNode[] | React.ReactNode;
}

class Menu extends React.Component<MenuProps> {
  render() {
    const { className } = this.props;
    return (
      <BaseMenu className={cx("idseq-ui", className)} {...this.props}>
        {this.props.children}
      </BaseMenu>
    );
  }
}

class MenuItem extends React.Component<MenuProps> {
  render() {
    const { className } = this.props;
    return (
      <BaseMenu.Item className={cx("idseq-ui", className)} {...this.props}>
        {this.props.children}
      </BaseMenu.Item>
    );
  }
}

export { Menu, MenuItem };
