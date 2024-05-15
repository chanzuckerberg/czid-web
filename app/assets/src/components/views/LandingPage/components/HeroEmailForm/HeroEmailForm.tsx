import React, { useState } from "react";
import { graphql, useMutation } from "react-relay";
import { useHistory } from "react-router-dom";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import { EMAIL_TAKEN_ERROR } from "~/api/user";
import ArrowSubmit from "~/components/ui/icons/IconSubmitArrow";
import cs from "./HeroEmailForm.scss";

const HeroEmailFormMutation = graphql`
  mutation HeroEmailFormMutation($email: String!) {
    createUser(email: $email) {
      email
    }
  }
`;

export const HeroEmailForm = () => {
  const trackEvent = useTrackEvent();
  const [enteredEmail, setEnteredEmail] = useState("");
  const [commitMutation, isMutationInFlight] = useMutation(
    HeroEmailFormMutation,
  );
  const RouterHistory = useHistory();

  function isValidEmail(enteredEmail: string) {
    const emailRegex =
      /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(enteredEmail);
  }

  async function registerAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isValidEmail(enteredEmail)) {
      commitMutation({
        variables: {
          email: enteredEmail,
        },
        onCompleted: () => {
          RouterHistory.push("/users/register");
          location.reload();
        },
        onError: err => {
          if (err.message.includes(EMAIL_TAKEN_ERROR)) {
            RouterHistory.push("/users/register?error=email");
          } else {
            RouterHistory.push("/users/register?error=unknown");
          }
          location.reload();
        },
      });

      // Log lowercase emails, since emails are lowercased in the database
      trackEvent(
        ANALYTICS_EVENT_NAMES.LANDING_PAGE_REGISTER_NOW_BUTTON_CLICKED,
        { email: enteredEmail.toLowerCase() },
      );
    } else {
      alert("Please enter a valid email address.");
    }
  }

  return (
    <div className={cs.heroEmailForm}>
      <form onSubmit={e => registerAccount(e)}>
        <input
          placeholder="Your email address"
          value={enteredEmail}
          onChange={e => {
            setEnteredEmail(e.target.value);
          }}
        />
        <button
          aria-label="Register for a CZ ID account with your email address"
          type="submit"
          disabled={isMutationInFlight}
          className={isMutationInFlight ? cs.disabled : ""}
        >
          Register Now
          <span>
            <ArrowSubmit />
          </span>
        </button>
      </form>
    </div>
  );
};
