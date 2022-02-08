import PropTypes from "prop-types";
import React from "react";

export default class ContextPlaceholder extends React.PureComponent {
  // Creates a placeholder for components whose position will be relative
  // to a given DOM element. Similar to semantic-ui Popup.
  // Rewrote because could not make Popup work as a controllable component
  // while respondig to events like click outside.
  // Some positioning decisions

  constructor(props) {
    super(props);

    this.state = {
      style: this.getStyle(),
      open: this.props.open,
    };
  }

  componentDidMount() {
    if (this.props.closeOnOutsideClick) {
      document.addEventListener("mousedown", this.handleOutClick);
    }
  }

  componentWillUnmount() {
    if (this.props.closeOnOutsideClick) {
      document.removeEventListener("mousedown", this.handleOutClick);
    }
  }

  handleOutClick = () => {
    if (this.placeholderRef && !this.placeholderRef.contains(event.target)) {
      this.setState({ open: false });
      this.props.onClose && this.props.onClose();
    }
  };

  handlePlaceholderRef = placeholder => {
    this.placeholderRef = placeholder;
    this.setState({ style: this.getStyle() });
  };

  getStyle() {
    let style = { position: "absolute" };
    if (this.props.context && this.placeholderRef) {
      Object.assign(style, this.getPlaceholderPosition());
    }
    return style;
  }

  getPlaceholderPosition() {
    const contextRect = this.props.context.getBoundingClientRect();
    const placeholderRect = this.placeholderRef.getBoundingClientRect();
    let { horizontalOffset, verticalOffset, position } = this.props;
    const { pageYOffset, pageXOffset } = window;
    const { clientWidth, clientHeight } = document.documentElement;

    let right = 0;
    let left = 0;
    let top = 0;
    let bottom = 0;

    if (position.includes("right")) {
      right = Math.round(
        clientWidth -
          (contextRect.right + pageXOffset) +
          contextRect.width / 2 -
          horizontalOffset,
      );
      // If the placeholder is wider than how far to the right its trigger is positioned,
      // then add an offset so that the placeholder doesn't run off the screen.
      if (placeholderRect.width > contextRect.right) {
        const xOffset = contextRect.right - placeholderRect.width;
        right = right + xOffset;
      }
      left = "auto";
    } else if (position.includes("left")) {
      left = Math.round(
        contextRect.left +
          pageXOffset +
          contextRect.width / 2 +
          horizontalOffset,
      );
      right = "auto";
    } else {
      // center
      const xOffset = (contextRect.width - placeholderRect.width) / 2;
      left = Math.round(
        contextRect.left + xOffset + pageXOffset + horizontalOffset,
      );
      right = "auto";
    }

    if (position.includes("top")) {
      bottom = Math.round(
        clientHeight -
          (contextRect.top + pageYOffset) -
          contextRect.height / 2 +
          verticalOffset,
      );
      top = "auto";
    } else if (position.includes("bottom")) {
      top = Math.round(
        contextRect.bottom +
          pageYOffset -
          contextRect.height / 2 +
          verticalOffset,
      );
      bottom = "auto";
    } else {
      // middle
      const yOffset = (contextRect.height + placeholderRect.height) / 2;
      top = Math.round(
        contextRect.bottom + pageYOffset - yOffset + verticalOffset,
      );
      bottom = "auto";
    }

    return { left, right, top, bottom };
  }

  render() {
    return (
      this.state.open && (
        <div style={this.state.style} ref={this.handlePlaceholderRef}>
          {this.props.children}
        </div>
      )
    );
  }
}

ContextPlaceholder.defaultProps = {
  position: "bottom left",
  horizontalOffset: 0,
  verticalOffset: 0,
  closeOnOutsideClick: false,
  open: true,
};

ContextPlaceholder.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClose: PropTypes.func,
  horizontalOffset: PropTypes.number,
  verticalOffset: PropTypes.number,
  open: PropTypes.bool,
  position: PropTypes.string,
  closeOnOutsideClick: PropTypes.bool,
  context: PropTypes.instanceOf(Element),
};
