import React from "react";
import { keys, filter } from "lodash/fp";
import cx from "classnames";

import Checkbox from "~ui/controls/Checkbox";
import NarrowContainer from "~/components/layout/NarrowContainer";

import cs from "./playground_typography.scss";

class PlaygroundTypography extends React.Component {
  state = {
    highlightBorder: false,
    upperCase: false,
  };

  toggleHighlightBorder = () => {
    this.setState({
      highlightBorder: !this.state.highlightBorder,
    });
  };

  toggleUpperCase = () => {
    this.setState({
      upperCase: !this.state.upperCase,
    });
  };

  render() {
    const { highlightBorder, upperCase } = this.state;

    // Display all the CSS classes starting with "font".
    const fontClasses = filter(
      cssClass => cssClass.startsWith("font"),
      keys(cs)
    );

    const fontHeaderClasses = filter(
      cssClass => cssClass.startsWith("font-header"),
      fontClasses
    );
    const fontBodyClasses = filter(
      cssClass => cssClass.startsWith("font-body"),
      fontClasses
    );
    const fontOtherClasses = filter(
      cssClass =>
        !(
          cssClass.startsWith("font-header") || cssClass.startsWith("font-body")
        ),
      fontClasses
    );

    return (
      <NarrowContainer>
        <div className={cs.header}>
          <div className={cs.title}>Typography</div>
          <div className={cs.controls}>
            <Checkbox
              className={cs.checkbox}
              checked={highlightBorder}
              label="Show borders"
              onChange={this.toggleHighlightBorder}
            />
            <Checkbox
              className={cs.checkbox}
              checked={upperCase}
              label="Upper case"
              onChange={this.toggleUpperCase}
            />
          </div>
        </div>
        <div
          className={cx(
            cs.multilineText,
            cs.borderContainer,
            highlightBorder && cs.highlight
          )}
        >
          <div className={cs.container}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </div>
        </div>
        <div className={cs.playgroundTypography}>
          {[fontHeaderClasses, fontBodyClasses, fontOtherClasses].map(
            (classes, index) => (
              <div className={cs.column} key={index}>
                {classes.map(fontClass => (
                  <div
                    className={cx(
                      cs.borderContainer,
                      highlightBorder && cs.highlight
                    )}
                    key={fontClass}
                  >
                    <div
                      className={cx(
                        cs.container,
                        cs[fontClass],
                        upperCase && cs.upperCase
                      )}
                    >
                      {fontClass}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </NarrowContainer>
    );
  }
}

export default PlaygroundTypography;
