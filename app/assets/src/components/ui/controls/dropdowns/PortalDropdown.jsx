// This component is has most of the functionality of semantic-ui Dropdown.
// The only major shortcoming is that it can't handle nested dropdowns due to
// the document mousedown event listeners. If a user clicks on a dropdown inside
// another dropdown, this click will be interpreted by the outer dropdown as being an outside-click,
// because we are using Portals.
// TODO(mark): Handle nested dropdowns case, and replace semantic-ui dropdown with this component.
import React from "react";
import PropTypes from "prop-types";
import { Manager, Reference, Popper } from "react-popper";
import ReactDOM from "react-dom";
import cx from "classnames";

import cs from "./portal_dropdown.scss";

// TODO(mark): Handle opening and closing when focused with the Tab key.
class PortalDropdown extends React.Component {
  state = {
    open: false,
    // Used to give the menuContainer min-width equal to the trigger element.
    triggerWidth: null
  };

  componentDidMount() {
    document.addEventListener("mousedown", this.handleOutClick);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleOutClick);
  }

  toggleOpen = () => {
    this.state.open ? this.close() : this.open();
  };

  open = () => {
    if (this.props.disabled) return;
    this._lastTransform = null;
    this.setState({
      open: true,
      // Measure the trigger width.
      triggerWidth: this._triggerRef
        ? this._triggerRef.getBoundingClientRect().width
        : null
    });
    if (this.props.onOpen) {
      this.props.onOpen();
    }
  };

  close = () => {
    this._lastTransform = null;
    this.setState({
      open: false
    });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  handleOutClick = () => {
    if (
      !(this._triggerRef && this._triggerRef.contains(event.target)) &&
      !(this._menuRef && this._menuRef.contains(event.target))
    ) {
      this.close();
    }
  };

  render() {
    const open =
      this.props.open === undefined ? this.state.open : this.props.open;

    return (
      <Manager>
        <Reference>
          {({ ref }) => {
            return (
              <div
                className={cx(
                  cs.triggerContainer,
                  this.props.fluid && cs.fluid,
                  this.props.triggerClassName,
                  this.props.disabled && cs.disabled,
                  !this.props.hideArrow &&
                    (this.props.arrowInsideTrigger
                      ? cs.arrowInsideTrigger
                      : cs.arrowOutsideTrigger)
                )}
                ref={c => {
                  ref(c);
                  this._triggerRef = c;
                }}
                onClick={this.toggleOpen}
              >
                {React.cloneElement(this.props.trigger, {
                  active: open
                })}
                {!this.props.hideArrow && (
                  <i className={cx(cs.arrow, this.state.open && cs.active)} />
                )}
              </div>
            );
          }}
        </Reference>
        {open &&
          ReactDOM.createPortal(
            <Popper
              placement={
                this.props.direction === "right" ? "bottom-start" : "bottom-end"
              }
              modifiers={{
                preventOverflow: { enabled: false },
                hide: { enabled: false }
              }}
            >
              {({ ref, style, placement }) => {
                // This is a dirty but necessary hack.
                // react-popper doesn't seem to handle outOfBoundaries properly, so we
                // manually detect if the popper has moved, and hide it if it has.
                // (react-popper doesn't have this functionality either)
                // Otherwise, the popper will continue to show even when the trigger element
                // is no longer visible in the scrollable area.
                if (
                  this._lastTransform &&
                  this._lastTransform !== style.transform &&
                  open
                ) {
                  this._lastTransform = null;
                  setTimeout(this.close);
                } else if (open) {
                  this._lastTransform = style.transform;
                }

                return (
                  <div
                    className={cx(
                      this.props.menuClassName,
                      cs.popperMenu,
                      this.props.floating && cs.floating,
                      this.props.withinModal && cs.withinModal
                    )}
                    onClick={this.close}
                    ref={c => {
                      ref(c);
                      this._menuRef = c;
                    }}
                    data-placement={placement}
                    style={
                      this.state.triggerWidth
                        ? { minWidth: this.state.triggerWidth, ...style }
                        : style
                    }
                  >
                    {this.props.menu}
                  </div>
                );
              }}
            </Popper>,
            document.body
          )}
      </Manager>
    );
  }
}

PortalDropdown.propTypes = {
  trigger: PropTypes.node,
  menu: PropTypes.node,
  menuClassName: PropTypes.string,
  triggerClassName: PropTypes.string,
  withinModal: PropTypes.bool,
  direction: PropTypes.oneOf(["left", "right"]),
  fluid: PropTypes.bool,
  floating: PropTypes.bool,
  disabled: PropTypes.bool,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  hideArrow: PropTypes.bool,
  arrowInsideTrigger: PropTypes.bool
};

PortalDropdown.defaultProps = {
  direction: "right"
};

export default PortalDropdown;
