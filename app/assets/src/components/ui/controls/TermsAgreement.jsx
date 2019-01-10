import React from "react";
import PropTypes from "prop-types";
import cs from "./terms_agreement.scss";
import Checkbox from "~ui/controls/Checkbox";

class TermsAgreement extends React.Component {
  render() {
    const { onChange, checked, disabled } = this.props;

    return (
      <div className={cs.termsAgreement}>
        <Checkbox
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          value={1}
          label={
            <span>
              <span>
                {
                  "I agree that the data I am uploading to IDseq has been lawfully collected and that I have all the necessary consents, permissions, and authorizations needed to collect, share, and export data to IDseq as outlined in the "
                }
              </span>
              <a
                href="https://assets.idseq.net/Terms.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
              {" and "}
              <a
                href="https://assets.idseq.net/Privacy.pdf"
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
  disabled: PropTypes.bool
};

export default TermsAgreement;
