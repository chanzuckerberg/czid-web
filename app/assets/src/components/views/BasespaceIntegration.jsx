import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import PropTypes from "~/components/utils/propTypes";

import cs from "./basespace_integration.scss";

export default class BasespaceIntegration extends React.Component {
  componentDidMount() {
    const { accessToken } = this.props;
    if (window.opener && accessToken) {
      window.opener.postMessage(
        {
          basespaceAccessToken: this.props.accessToken,
        },
        window.location.origin,
      );
    }

    // Log whether an access token was returned.
    if (accessToken) {
      logAnalyticsEvent("BasespaceIntegration_authorization_succeeded");
    } else {
      logAnalyticsEvent("BasespaceIntegration_authorization_failed");
    }
  }

  closeWindow = () => {
    window.close();
  };

  render() {
    const { accessToken } = this.props;
    return (
      <div className={cs.basespaceIntegration}>
        <div className={cs.content}>
          {accessToken ? (
            <div>
              <div className={cs.message}>
                You&apos;ve successfully authorized CZ ID to connect to
                Basespace!
              </div>
              <div className={cs.smallMessage}>
                You can now return to the CZ ID Upload page.
              </div>
            </div>
          ) : (
            <div className={cs.error}>
              Something went wrong when trying to connect to Basespace. Please
              <a className={cs.helpLink} href="mailto:help@czid.org">
                &nbsp;contact us
              </a>{" "}
              for help.
            </div>
          )}
          <PrimaryButton
            text="Close Window"
            rounded={false}
            onClick={this.closeWindow}
          />
        </div>
      </div>
    );
  }
}

BasespaceIntegration.propTypes = {
  accessToken: PropTypes.string,
};
