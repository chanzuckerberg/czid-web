import React from "react";

interface ContextPlaceholderProps {
  children?: React.ReactNode[] | React.ReactNode;
  onClose?: () => void;
  horizontalOffset?: number;
  verticalOffset?: number;
  open?: boolean;
  position?: string;
  closeOnOutsideClick?: boolean;
  context?: Element;
}

interface ContextPlaceholderState {
  style: $TSFixMe;
  open: boolean;
}

export default class ContextPlaceholder extends React.PureComponent<
  ContextPlaceholderProps,
  ContextPlaceholderState
> {
  static defaultProps: ContextPlaceholderProps;
  placeholderRef: $TSFixMe;
  // Creates a placeholder for components whose position will be relative
  // to a given DOM element. Similar to semantic-ui Popup.
  // Rewrote because could not make Popup work as a controllable component
  // while respondig to events like click outside.
  // Some positioning decisions

  constructor(props) {
    super(props);

    this.state = {
      style: this.getStyle(),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    const style = { position: "absolute" };
    if (this.props.context && this.placeholderRef) {
      Object.assign(style, this.getPlaceholderPosition());
    }
    return style;
  }

  getPlaceholderPosition() {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const contextRect = this.props.context.getBoundingClientRect();
    const placeholderRect = this.placeholderRef.getBoundingClientRect();
    const { horizontalOffset, verticalOffset, position } = this.props;
    const { pageYOffset, pageXOffset } = window;
    const { clientWidth, clientHeight } = document.documentElement;

    let right: string | number = 0;
    let left: string | number = 0;
    let top: string | number = 0;
    let bottom: string | number = 0;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (position.includes("right")) {
      right = Math.round(
        clientWidth -
          (contextRect.right + pageXOffset) +
          contextRect.width / 2 -
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          horizontalOffset,
      );
      // If the placeholder is wider than how far to the right its trigger is positioned,
      // then add an offset so that the placeholder doesn't run off the screen.
      if (placeholderRect.width > contextRect.right) {
        const xOffset = contextRect.right - placeholderRect.width;
        right = right + xOffset;
      }
      left = "auto";
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    } else if (position.includes("left")) {
      left = Math.round(
        contextRect.left +
          pageXOffset +
          contextRect.width / 2 +
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          horizontalOffset,
      );
      right = "auto";
    } else {
      // center
      const xOffset = (contextRect.width - placeholderRect.width) / 2;
      left = Math.round(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        contextRect.left + xOffset + pageXOffset + horizontalOffset,
      );
      right = "auto";
    }

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (position.includes("top")) {
      bottom = Math.round(
        clientHeight -
          (contextRect.top + pageYOffset) -
          contextRect.height / 2 +
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          verticalOffset,
      );
      top = "auto";
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    } else if (position.includes("bottom")) {
      top = Math.round(
        contextRect.bottom +
          pageYOffset -
          contextRect.height / 2 +
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          verticalOffset,
      );
      bottom = "auto";
    } else {
      // middle
      const yOffset = (contextRect.height + placeholderRect.height) / 2;
      top = Math.round(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
