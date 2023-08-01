import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { EMAIL_TAKEN_ERROR, useCreateUser } from "~/api/user";
import ArrowSubmit from "~/components/ui/icons/IconSubmitArrow";
import cs from "./HeroEmailForm.scss";

interface HeroEmailFormProps {
  autoAcctCreationEnabled?: boolean;
}

const HeroEmailForm = ({ autoAcctCreationEnabled }: HeroEmailFormProps) => {
  const [enteredEmail, setEnteredEmail] = useState("");
  const userCreator = useCreateUser();
  const RouterHistory = useHistory();

  function isValidEmail(enteredEmail: string) {
    const emailRegex =
      /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(enteredEmail);
  }

  function requestAccess(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (isValidEmail(enteredEmail)) {
      window.open(
        `https://airtable.com/shrBGT42xVBR6JAVv?prefill_Email=${enteredEmail}`,
        "_blank",
      );
    } else {
      alert("Please enter a valid email address.");
    }
  }

  async function registerAccount(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (isValidEmail(enteredEmail)) {
      try {
        // @ts-expect-error This expression is not callable.
        await userCreator({
          variables: {
            email: enteredEmail,
          },
        }).then(() => {
          RouterHistory.push("/users/register");
        });
      } catch (err) {
        if (err.message === EMAIL_TAKEN_ERROR) {
          RouterHistory.push("/users/register?error=email");
        } else {
          RouterHistory.push("/users/register?error=unknown");
        }
      }
      location.reload();
    } else {
      alert("Please enter a valid email address.");
    }
  }

  const requestAccessButton = (
    <button
      aria-label="Request access to CZ ID via the CZ ID intro survey (opens in new window)"
      onClick={e => requestAccess(e)}
    >
      Request Access
      <span>
        <ArrowSubmit />
      </span>
    </button>
  );

  const registerNowButton = (
    <button
      aria-label="Register for a CZ ID account with your email address"
      onClick={e => registerAccount(e)}
    >
      Register Now
      <span>
        <ArrowSubmit />
      </span>
    </button>
  );

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
        {autoAcctCreationEnabled ? registerNowButton : requestAccessButton}
      </form>
    </div>
  );
};

export default HeroEmailForm;
