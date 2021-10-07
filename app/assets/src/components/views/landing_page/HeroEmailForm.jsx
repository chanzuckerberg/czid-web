import React, { useState } from "react";
import ArrowSubmit from "~/components/ui/icons/IconSubmitArrow";
import cs from "./HeroEmailForm.scss";

const HeroEmailForm = () => {
  const [enteredEmail, setEnteredEmail] = useState("");

  function submitEmail(e) {
    e.preventDefault();

    let emailRegex = /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (emailRegex.test(enteredEmail)) {
      window.open(
        `https://airtable.com/shrBGT42xVBR6JAVv?prefill_Email=${enteredEmail}`,
        "_blank"
      );
    } else {
      alert("Please enter a valid email address.");
    }
  }

  return (
    <div className={cs.heroEmailForm}>
      <form action="#">
        <input
          placeholder="Your email address"
          value={enteredEmail}
          onChange={e => {
            setEnteredEmail(e.target.value);
          }}
        />
        <button
          aria-label="Request access to IDseq via the IDseq intro survey (opens in new window)"
          onClick={e => {
            submitEmail(e);
          }}
        >
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
