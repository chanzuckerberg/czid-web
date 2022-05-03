import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import PrimaryButton from "../controls/buttons/PrimaryButton";
import SecondaryButton from "../controls/buttons/SecondaryButton";

const WizardContext = React.createContext({
  currentPage: 0,
  actions: {},
});

class Wizard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 0,
      continueEnabled: false,
      overlay: null,
    };

    this.showPageInfo = this.props.showPageInfo || true;
    this.skipPageInfoNPages = this.props.skipPageInfoNPages || 0;

    this.handleBackClick = this.handleBackClick.bind(this);
    this.handleContinueClick = this.handleContinueClick.bind(this);
    this.handleFinishClick = this.handleFinishClick.bind(this);

    this.labels = Object.assign(
      {
        back: "Back",
        continue: "Continue",
        finish: "Finish",
      },
      this.props.labels,
    );
  }

  static getDerivedStateFromProps(newProps, prevState) {
    if (newProps.defaultPage !== prevState.lastDefaultPage) {
      return {
        lastDefaultPage: newProps.defaultPage,
        currentPage: newProps.defaultPage,
      };
    }
    return null;
  }

  resetPageState = () => {
    this.setState({
      continueEnabled: true,
      onContinueValidation: null,
    });
  };

  handleContinueEnabled = enabled => {
    this.setState({
      continueEnabled: enabled,
    });
  };

  handleSetOnContinueValidation = onContinueValidation => {
    this.setState({
      onContinueValidation,
    });
  };

  // This will set an overlay over the wizard, covering all controls, the title, and other wizard elements.
  // Used for things like the Metadata Instructions page.
  setOverlay = overlay => {
    this.setState({
      overlay,
    });
  };

  handleBackClick() {
    if (this.state.currentPage > 0) {
      this.setState({ currentPage: this.state.currentPage - 1 });
      this.resetPageState();
    }
  }

  handleContinueClick = async () => {
    let onContinue = this.props.children[this.state.currentPage].props
      .onContinue;
    let onContinueAsync = this.props.children[this.state.currentPage].props
      .onContinueAsync;
    if (onContinue) {
      if (onContinue()) {
        this.advancePage();
      }
    } else if (onContinueAsync) {
      const result = await onContinueAsync();
      if (result) {
        this.advancePage();
      }
    } else if (this.state.onContinueValidation) {
      const result = await this.state.onContinueValidation();
      if (result) {
        this.advancePage();
      }
    } else {
      this.advancePage();
    }
  };

  advancePage = () => {
    const { children, wizardType } = this.props;
    const { currentPage } = this.state;

    if (currentPage < children.length - 1) {
      this.setState({ currentPage: currentPage + 1 }, () =>
        trackEvent(ANALYTICS_EVENT_NAMES.WIZARD_PAGE_ADVANCED, {
          wizard: wizardType,
          previousPage: this.state.currentPage - 1,
          currentPage: this.state.currentPage,
        }),
      );
      this.resetPageState();
    }
  };

  handleFinishClick() {
    this.props.onComplete();
  }

  render() {
    const currentPage = this.props.children[this.state.currentPage];

    const wizardActions = {
      continue: this.handleContinueClick,
      back: this.handleBackClick,
      finish: this.handleFinishClick,
    };

    let pageInfo = null;
    if (
      this.showPageInfo &&
      this.state.currentPage >= this.skipPageInfoNPages
    ) {
      pageInfo = `${this.state.currentPage -
        this.skipPageInfoNPages +
        1} of ${this.props.children.length - this.skipPageInfoNPages}`;
    }

    return (
      <WizardContext.Provider
        value={{ currentPage: this.state.currentPage, actions: wizardActions }}
      >
        {this.state.overlay}
        <div
          className={cx(
            "wizard",
            this.props.className,
            this.state.overlay && "wizard__hidden",
          )}
        >
          <div className="wizard__header">
            {pageInfo && <div className="wizard__header__page">{pageInfo}</div>}
            <div className="wizard__header__title">
              {currentPage.props.title || this.props.title}
            </div>
          </div>
          {/* Pass additional hooks to custom wizard pages */}
          <div className={cx("wizard__page_wrapper")}>
            {React.cloneElement(currentPage, {
              wizardEnableContinue: this.handleContinueEnabled,
              wizardSetOnContinueValidation: this.handleSetOnContinueValidation,
              wizardSetOverlay: this.setOverlay,
            })}
          </div>
          {!currentPage.props.skipDefaultButtons && (
            <div className="wizard__nav">
              {this.state.currentPage < this.props.children.length - 1 && (
                <PrimaryButton
                  text={this.labels.continue}
                  onClick={this.handleContinueClick}
                  disabled={!this.state.continueEnabled}
                  rounded={true}
                />
              )}
              {this.state.currentPage === this.props.children.length - 1 && (
                <PrimaryButton
                  text={this.labels.finish}
                  onClick={this.handleFinishClick}
                  rounded={true}
                />
              )}
              {this.state.currentPage > 0 && (
                <SecondaryButton
                  text={this.labels.back}
                  onClick={this.handleBackClick}
                  rounded={true}
                />
              )}
            </div>
          )}
        </div>
      </WizardContext.Provider>
    );
  }
}

Wizard.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.shape({
      type: Wizard.Page,
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        type: Wizard.Page,
      }),
    ),
  ]).isRequired,
  labels: PropTypes.objectOf(PropTypes.string),
  onComplete: PropTypes.func,
  showPageInfo: PropTypes.bool,
  skipPageInfoNPages: PropTypes.number,
  title: PropTypes.string,
  className: PropTypes.string,
  wizardType: PropTypes.string,
};

// You can use the Page component for basic use cases, or create your own custom page class.
// This component can't receive props such as "wizardEnableContinue", which allows you to toggle whether
// the continue button is enabled for the current page. Custom page classes such as UploadPage can.
class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.onLoad) {
      this.props.onLoad();
    }
  }

  render() {
    return (
      <div className={`wizard__page`}>
        {React.Children.toArray(this.props.children)}
      </div>
    );
  }
}

Page.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]).isRequired,
  onLoad: PropTypes.func,
  // Props are used in Wizard.
  skipDefaultButtons: PropTypes.bool,
};

Wizard.Page = Page;

const Action = ({ action, onAfterAction, children }) => {
  const handleOnClick = wizardAction => {
    wizardAction();

    if (onAfterAction) {
      onAfterAction();
    }
  };

  return (
    <WizardContext.Consumer>
      {({ actions }) => {
        return (
          <div
            className={`wizard__action wizard__action--${action}`}
            onClick={() => handleOnClick(actions[action])}
          >
            {children}
          </div>
        );
      }}
    </WizardContext.Consumer>
  );
};

Action.propTypes = {
  action: PropTypes.oneOf(["back", "continue", "finish"]),
  children: PropTypes.node.isRequired,
  onAfterAction: PropTypes.func,
};

Wizard.Action = Action;

export default Wizard;
