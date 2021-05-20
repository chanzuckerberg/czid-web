import PropTypes from "prop-types";
import React from "react";
import Checkbox from "~ui/controls/Checkbox";
import cs from "./terms_agreement.scss";

class TermsAgreement extends React.Component {
  render() {
    const { onChange, checked } = this.props;

    return (
      <div className={cs.termsAgreement}>
        <Checkbox
          checked={checked}
          onChange={onChange}
          value={1}
          label={
            <span>
              <span>
                {
                  "I agree that the data I am uploading to IDseq has been lawfully collected and that I have all the necessary consents, permissions, and authorizations needed to collect, share, and export data to IDseq as outlined in the "
                }
              </span>
              <a
                href="https://idseq.net/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
              {" and "}
              <a
                href="https://idseq.net/privacy"
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

TermsAgreement.propTypes = {
  onChange: PropTypes.func,
  checked: PropTypes.bool,
};

export default TermsAgreement;
