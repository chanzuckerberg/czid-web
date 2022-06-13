import cx from "classnames";
import React from "react";
import { Sidebar as SemanticSidebar } from "semantic-ui-react";
import { IconClose } from "~ui/icons";
import cs from "./sidebar.scss";

interface SidebarProps {
  direction?: "right" | "left" | "top" | "bottom";
  width?: "very thin" | "thin" | "wide" | "very wide";
  visible?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClose?: $TSFixMeFunction;
}

class Sidebar extends React.Component<SidebarProps> {
  static defaultProps: SidebarProps;
  render() {
    const { children, className, ...props } = this.props;
    return (
      <SemanticSidebar
        {...props}
        animation="overlay"
        className={cx(cs.sidebar, className, cs[this.props.direction])}
      >
        {children}
        <div onClick={this.props.onClose}>
          <IconClose className={cs.closeIcon} />
        </div>
      </SemanticSidebar>
    );
  }
}

Sidebar.defaultProps = {
  direction: "right",
};

export default Sidebar;
