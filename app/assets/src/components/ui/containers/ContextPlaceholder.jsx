import React from "react";
import PropTypes from "prop-types";

export default class ContextPlaceholder extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      style: this.getStyle(),
      open: this.props.open
    };
  }

  componentDidMount() {
    if (this.props.closeOnOutsideClick)
      document.addEventListener("mousedown", this.handleOutClick);
  }

  componentWillUnmount() {
    if (this.props.closeOnOutsideClick)
      document.removeEventListener("mousedown", this.handleOutClick);
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
      Object.assign(style, this.getPosition());
    }
    return style;
  }

  getPosition() {
    const contextRect = this.props.context.getBoundingClientRect();
    const placeholderRect = this.placeholderRef.getBoundingClientRect();
    let { horizontalOffset, verticalOffset, position } = this.props;
    const { pageYOffset, pageXOffset } = window;
    const { clientWidth, clientHeight } = document.documentElement;

    let right = 0,
      left = 0,
      top = 0,
      bottom = 0;

    if (position.includes("right")) {
      right = Math.round(
        clientWidth -
          (contextRect.right + pageXOffset) +
          contextRect.width / 2 -
          horizontalOffset
      );
      left = "auto";
    } else if (position.includes("left")) {
      left = Math.round(
        contextRect.left +
          pageXOffset +
          contextRect.width / 2 +
          horizontalOffset
      );
      right = "auto";
    } else {
      // center
      const xOffset = (contextRect.width - placeholderRect.width) / 2;
      left = Math.round(
        contextRect.left + xOffset + pageXOffset + horizontalOffset
      );
      right = "auto";
    }

    if (position.includes("top")) {
      bottom = Math.round(
        clientHeight -
          (contextRect.top + pageYOffset) -
          contextRect.height / 2 +
          verticalOffset
      );
      top = "auto";
    } else if (position.includes("bottom")) {
      top = Math.round(
        contextRect.bottom +
          pageYOffset -
          contextRect.height / 2 +
          verticalOffset
      );
      bottom = "auto";
    } else {
      // middle
      const yOffset = (contextRect.height + placeholderRect.height) / 2;
      top = Math.round(
        contextRect.bottom + pageYOffset - yOffset + verticalOffset
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
  open: true
};

ContextPlaceholder.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  onClose: PropTypes.func,
  horizontalOffset: PropTypes.number,
  verticalOffset: PropTypes.number,
  open: PropTypes.bool,
  position: PropTypes.string,
  closeOnOutsideClick: PropTypes.bool,
  context: PropTypes.instanceOf(Element)
};
