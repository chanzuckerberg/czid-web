import cx from "classnames";
import { filter, keys } from "lodash/fp";
import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import Checkbox from "~ui/controls/Checkbox";
import cs from "./playground_typography.scss";

class PlaygroundTypography extends React.Component {
  state = {
    upperCase: false,
  };

  toggleUpperCase = () => {
    this.setState({
      upperCase: !this.state.upperCase,
    });
  };

  render() {
    const { upperCase } = this.state;

    // Display all the CSS classes starting with "font".
    const fontClasses = filter(
      cssClass => cssClass.startsWith("font"),
      keys(cs),
    );

    const fontHeaderClasses = filter(
      cssClass => cssClass.startsWith("font-header"),
      fontClasses,
    );
    const fontBodyClasses = filter(
      cssClass => cssClass.startsWith("font-body"),
      fontClasses,
    );
    const fontOtherClasses = filter(
      cssClass =>
        !(
          cssClass.startsWith("font-header") || cssClass.startsWith("font-body")
        ),
      fontClasses,
    );

    return (
      <NarrowContainer>
        <div className={cs.header}>
          <div className={cs.title}>Typography</div>
          <div className={cs.controls}>
            <Checkbox
              className={cs.checkbox}
              checked={upperCase}
              label="Upper case"
              onChange={this.toggleUpperCase}
            />
          </div>
        </div>
        <div className={cs.playgroundTypography}>
          {[fontHeaderClasses, fontBodyClasses, fontOtherClasses].map(
            (classes, index) => (
              <div className={cs.column} key={index}>
                {classes.map(fontClass => (
                  <div className={cx(cs.borderContainer)} key={fontClass}>
                    <div
                      className={cx(
                        cs.container,
                        cs[fontClass],
                        upperCase && cs.upperCase,
                      )}
                    >
                      {fontClass}
                    </div>
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
      </NarrowContainer>
    );
  }
}

export default PlaygroundTypography;
