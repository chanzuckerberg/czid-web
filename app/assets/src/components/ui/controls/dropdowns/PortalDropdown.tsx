// This component is has most of the functionality of semantic-ui Dropdown.
// The only major shortcoming is that it can't handle nested dropdowns due to
// the document mousedown event listeners. If a user clicks on a dropdown inside
// another dropdown, this click will be interpreted by the outer dropdown as being an outside-click,
// because we are using Portals.
// TODO(mark): Handle nested dropdowns case, and replace semantic-ui dropdown with this component.
import cx from "classnames";
import React from "react";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import cs from "./portal_dropdown.scss";

interface PortalDropdownProps {
  trigger: React.ReactNode;
  menu: React.ReactNode;
  menuClassName: string;
  triggerClassName: string;
  withinModal: boolean;
  direction: "left" | "right";
  fluid: boolean;
  floating: boolean;
  disabled: boolean;
  onOpen: $TSFixMeFunction;
  onClose: $TSFixMeFunction;
  open: boolean;
  hideArrow: boolean;
  arrowInsideTrigger: boolean;
}

// TODO(mark): Handle opening and closing when focused with the Tab key.
class PortalDropdown extends React.Component<PortalDropdownProps> {
  _lastTransform: $TSFixMe;
  _menuRef: $TSFixMe;
  _triggerRef: $TSFixMe;
  state = {
    open: false,
    // Used to give the menuContainer min-width equal to the trigger element.
    triggerWidth: null,
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
        : null,
    });
    if (this.props.onOpen) {
      this.props.onOpen();
    }
  };

  close = () => {
    this._lastTransform = null;
    this.setState({
      open: false,
    });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  // We use props.open if it's passed in, otherwise state.open.
  // This allows the component to be controllable from the parent, but also
  // work independently.
  isOpen = () =>
    this.props.open === undefined || this.props.open === null
      ? this.state.open
      : this.props.open;

  handleOutClick = () => {
    if (
      this.isOpen() &&
      !(this._triggerRef && this._triggerRef.contains(event.target)) &&
      !(this._menuRef && this._menuRef.contains(event.target))
    ) {
      this.close();
    }
  };

  render() {
    const open = this.isOpen();

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
                      : cs.arrowOutsideTrigger),
                )}
                ref={c => {
                  // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
                  ref(c);
                  this._triggerRef = c;
                }}
                onClick={this.toggleOpen}
              >
                {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'trigger' */}
                {React.cloneElement(this.props.trigger, {
                  active: open,
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
                hide: { enabled: false },
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
                      this.props.withinModal && cs.withinModal,
                    )}
                    onClick={this.close}
                    ref={c => {
                      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
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
            document.body,
          )}
      </Manager>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
PortalDropdown.defaultProps = {
  direction: "right",
};

export default PortalDropdown;
