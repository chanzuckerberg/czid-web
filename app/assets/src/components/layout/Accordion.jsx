import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import cs from "./accordion.scss";

class Accordion extends React.Component {
  state = {};

  onToggle = () => {
    this.setState({
      open: this.state.wasToggled ? !this.state.open : !this.props.open,
      wasToggled: true
    });
  };

  render() {
    const {
      header,
      children,
      toggleable,
      className,
      iconClassName,
      bottomContentPadding
    } = this.props;

    const open = this.state.wasToggled ? this.state.open : this.props.open;

    return (
      <div className={cx(cs.accordion, className)}>
        <div
          className={cx(cs.header, toggleable && cs.toggleable)}
          onClick={this.props.onToggle || this.onToggle}
        >
          {header}
          <div className={cs.fill} />
          {toggleable && (
            <div className={cs.toggleContainer}>
              <i
                className={cx(
                  "fa",
                  open ? "fa-angle-up" : "fa-angle-down",
                  cs.toggleIcon,
                  iconClassName
                )}
              />
            </div>
          )}
        </div>
        {(open || !toggleable) && (
          <div
            className={cx(cs.content, bottomContentPadding && cs.bottomPadding)}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
}

Accordion.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  toggleable: PropTypes.bool,
  // Accordion can be controlled or non-controlled.
  onToggle: PropTypes.func,
  open: PropTypes.bool,
  // Useful for separating the accordion content from the elements below it.
  bottomContentPadding: PropTypes.bool,
  header: PropTypes.node,
  children: PropTypes.node
};

Accordion.defaultProps = {
  toggleable: true,
  open: false
};

export default Accordion;
