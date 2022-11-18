import React from "react";
import Checkbox from "~ui/controls/Checkbox";
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
              <a
                href="https://czid.org/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
              {" and "}
              <a
                href="https://czid.org/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Data Privacy Notice.
              </a>
            </span>
          }
        />
      </div>
    );
  }
}

export default TermsAgreement;
