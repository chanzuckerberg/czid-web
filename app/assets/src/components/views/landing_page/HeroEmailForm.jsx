import React from "react";
import ArrowSubmit from "~/components/ui/icons/IconSubmitArrow";
import cs from "./HeroEmailForm.scss";

const HeroEmailForm = () => {
  return (
    <div className={cs.heroEmailForm}>
      <form action="#">
        <input placeholder="Your email address" type="email" />
        <button type="submit">
          Request Access
          <span>
            <ArrowSubmit />
          </span>
        </button>
      </form>
    </div>
  );
};

export default HeroEmailForm;
