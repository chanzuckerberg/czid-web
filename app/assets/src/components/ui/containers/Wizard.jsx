import PropTypes from "prop-types";
import React from "react";
import PrimaryButton from "../controls/buttons/PrimaryButton";

const WizardContext = React.createContext({
  currentPage: 0,
  actions: {}
});

class Wizard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 0
    };

    this.pages = this.props.children;
    this.showPageInfo = this.props.showPageInfo || true;
    this.skipPageInfoNPages = this.props.skipPageInfoNPages || 0;

    this.handleBackClick = this.handleBackClick.bind(this);
    this.handleContinueClick = this.handleContinueClick.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);
  }

  componentWillReceiveProps(newProps) {
    console.log("will receive", this.props.defaultPage, newProps.defaultPage);
    if (this.props.defaultPage != newProps.defaultPage) {
      this.setState({ currentPage: newProps.defaultPage });
    }
  }

  handleBackClick() {
    if (this.state.currentPage > 0) {
      this.setState({ currentPage: this.state.currentPage - 1 });
    }
  }

  handleContinueClick() {
    if (this.state.currentPage < this.pages.length - 1) {
      this.setState({ currentPage: this.state.currentPage + 1 });
    }
  }

  handleFinishClick() {
    console.log(this.props);
    this.props.onComplete();
  }

  render() {
    const currentPage = this.pages[this.state.currentPage];

    const wizardActions = {
      continue: this.handleContinueClick,
      back: this.handleBackClick,
      finish: this.handleFinishClick
    };

    console.log(this.pages, currentPage);
    return (
      <WizardContext.Provider
        value={{ currentPage: this.state.currentPage, actions: wizardActions }}
      >
        <div className="wizard">
          <div className="wizard__header">
            <div className="wizard__header__title">
              {currentPage.props.title || this.props.title}
            </div>
            {this.showPageInfo && (
              <div className="wizard__header__page">
                {this.state.currentPage >= this.skipPageInfoNPages
                  ? `${this.state.currentPage -
                      this.skipPageInfoNPages +
                      1} / ${this.pages.length - this.skipPageInfoNPages}`
                  : "\u00A0"}
              </div>
            )}
          </div>
          <div className="wizard__page">{currentPage}</div>
          {!currentPage.props.skipDefaultButtons && (
            <div className="wizard__nav">
              <PrimaryButton
                text="Back"
                disabled={this.state.currentPage <= 0}
                onClick={this.handleBackClick}
              />
              {this.state.currentPage < this.pages.length - 1 && (
                <PrimaryButton
                  text="Continue"
                  onClick={this.handleContinueClick}
                />
              )}
              {this.state.currentPage == this.pages.length - 1 && (
                <PrimaryButton text="Finish" onClick={this.handleFinishClick} />
              )}
            </div>
          )}
        </div>
      </WizardContext.Provider>
    );
  }
}

const Page = ({ children }) => {
  return children;
};

Wizard.Page = Page;

const Action = ({ action, children }) => {
  // const actions = {
  //   'continue': currentPage => currentPage + 1
  // }

  console.log(action, children);
  // return (
  //   <div>
  //     {children}
  //   </div>
  // );

  return (
    <WizardContext.Consumer>
      {({ currentPage, actions }) => {
        console.log(currentPage, actions);
        return <div onClick={actions["continue"]}>{children}</div>;
      }}
    </WizardContext.Consumer>
  );
};

Action.propTypes = {
  action: PropTypes.oneOf(["continue"]),
  children: PropTypes.element.isRequired
};

Wizard.Action = Action;

Wizard.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.shape({
      type: Wizard.Page
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        type: Wizard.Page
      })
    )
  ]).isRequired
};

export default Wizard;
