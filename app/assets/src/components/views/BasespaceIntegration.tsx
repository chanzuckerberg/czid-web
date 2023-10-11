import React from "react";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import { CONTACT_US_LINK } from "~/components/utils/documentationLinks";
import cs from "./basespace_integration.scss";

interface BasespaceIntegrationProps {
  accessToken?: string;
}

export default class BasespaceIntegration extends React.Component<BasespaceIntegrationProps> {
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
              <a
                className={cs.helpLink}
                href={CONTACT_US_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
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
