import React from "react";
import PropTypes from "prop-types";
import { forbidExtraProps } from "airbnb-prop-types";
import { Sidebar as SemanticSidebar } from "semantic-ui-react";
import cs from "./sidebar.scss";

class Sidebar extends React.Component {
  render() {
    const { children, ...props } = this.props;
    return (
      <SemanticSidebar {...props} animation="overlay" className={cs.sidebar}>
        {children}
      </SemanticSidebar>
    );
  }
}

Sidebar.propTypes = forbidExtraProps({
  direction: PropTypes.string /* top, left, right, bottom */,
  width: PropTypes.string /* very thin, thin, wide, very wide */,
  visible: PropTypes.bool,
  children: PropTypes.node
});

Sidebar.defaultProps = {
  direction: "right"
};

export default Sidebar;
