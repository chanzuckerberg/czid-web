import { InputCheckbox } from "@czi-sds/components";
import React from "react";
import cs from "./newsletter_consent_checkbox.scss";

interface NewsletterConsentCheckboxProps {
  newsletterConsent: boolean;
  setNewsletterConsent: (checkBoxValue: boolean) => void;
}

export function NewsletterConsentCheckbox({
  newsletterConsent,
  setNewsletterConsent,
}: NewsletterConsentCheckboxProps) {
  return (
    <div className={cs.main}>
      <div className={cs.titleSection}>
        <span className={cs.titleMainText}>Newsletter</span>
        <span className={cs.titleOptionalText}> — optional</span>
      </div>
      <span className={cs.checkbox}>
        <InputCheckbox
          stage={newsletterConsent ? "checked" : "unchecked"}
          onClick={() => setNewsletterConsent(!newsletterConsent)}
        />
      </span>
      <span className={cs.text}>
        {
          "Sign up for important product updates (i.e. new pipelines) and opportunities to try out new features early. Delivered quarterly to your inbox. Unsubscribe whenever you want."
        }
      </span>
    </div>
  );
}
