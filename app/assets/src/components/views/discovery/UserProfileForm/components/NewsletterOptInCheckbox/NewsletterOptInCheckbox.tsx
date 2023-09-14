import { InputCheckbox } from "@czi-sds/components";
import React from "react";
import cs from "./newsletter_opt_in_checkbox.scss";

interface NewsletterOptInCheckboxProps {
  optedInToNewsletter: boolean;
  setOptedInToNewsletter: (checkBoxValue: boolean) => void;
}

export function NewsletterOptInCheckbox({
  optedInToNewsletter,
  setOptedInToNewsletter,
}: NewsletterOptInCheckboxProps) {
  return (
    <div className={cs.main}>
      <div className={cs.titleSection}>
        <span className={cs.titleMainText}>Newsletter</span>
        <span className={cs.titleOptionalText}> — optional</span>
      </div>
      <span className={cs.checkbox}>
        <InputCheckbox
          stage={optedInToNewsletter ? "checked" : "unchecked"}
          onClick={() => setOptedInToNewsletter(!optedInToNewsletter)}
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
