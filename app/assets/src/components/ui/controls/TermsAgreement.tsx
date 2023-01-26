import React from "react";
import Checkbox from "~ui/controls/Checkbox";
import ExternalLink from "./ExternalLink";
import cs from "./terms_agreement.scss";

interface TermsAgreementProps {
  onChange?: $TSFixMeFunction;
  checked?: boolean;
}

class TermsAgreement extends React.Component<TermsAgreementProps> {
  render() {
    const { onChange, checked } = this.props;

    return (
      <div className={cs.termsAgreement} data-testid="terms-agreement-checkbox">
        <Checkbox
          checked={checked}
          onChange={onChange}
          value={1}
          label={
            <span>
              <span>
                {
                  "I agree that the data I am uploading to CZ ID has been lawfully collected and that I have all the necessary consents, permissions, and authorizations needed to collect, share, and export data to CZ ID as outlined in the "
                }
              </span>
              <ExternalLink href="https://czid.org/terms">
                Terms of Service
              </ExternalLink>
              {" and "}
              <ExternalLink href="https://czid.org/privacy">
                Privacy Policy
              </ExternalLink>
              .
            </span>
          }
        />
      </div>
    );
  }
}

export default TermsAgreement;
