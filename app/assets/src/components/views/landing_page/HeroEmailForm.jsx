import React from "react";
import ArrowRight from "~/images/landing_page/submit-arrow-icon.svg";
import cs from "./HeroEmailForm.scss";

const HeroEmailForm = () => {
  return (
    <div className={cs.heroEmailForm}>
      <form action="#">
        <input placeholder="Your email address" type="email" />
        <button type="submit">
          Request Access
          <span>
            <img src={ArrowRight} alt="" />
          </span>
        </button>
      </form>
    </div>
  );
};

export default HeroEmailForm;
