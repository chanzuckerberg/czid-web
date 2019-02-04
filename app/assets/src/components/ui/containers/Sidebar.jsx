import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import { forbidExtraProps } from "airbnb-prop-types";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import { Sidebar as SemanticSidebar } from "semantic-ui-react";
import cs from "./sidebar.scss";

class Sidebar extends React.Component {
  render() {
    const { children, className, ...props } = this.props;
    return (
      <SemanticSidebar
        {...props}
        animation="overlay"
        className={cx(cs.sidebar, className)}
      >
        {children}
        <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
      </SemanticSidebar>
    );
  }
}

Sidebar.propTypes = forbidExtraProps({
  direction: PropTypes.string /* top, left, right, bottom */,
  width: PropTypes.string /* very thin, thin, wide, very wide */,
  visible: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired
});

Sidebar.defaultProps = {
  direction: "right"
};

export default Sidebar;
