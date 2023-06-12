import { Button, Link, Tooltip } from "@czi-sds/components";
import { isEmpty } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import {
  postToAirtable as airtablePost,
  updateUserData as userUpdater,
} from "~/api/user";
import { UserContext } from "~/components/common/UserContext";
import { NarrowContainer } from "~/components/layout";
import { DISCOVERY_DOMAIN_MY_DATA } from "../discovery_api";
import CountryFormField from "./components/CountryFormField";
import CZIDReferralFormField from "./components/CZIDReferralFormField";
import CZIDUsecaseFormField from "./components/CZIDUsecaseFormField";
import InstitutionFormField from "./components/InstitutionFormField";
import NameField from "./components/NameField";
import SequencingExpertiseFormField from "./components/SequencingExpertiseFormField";
import {
  REGEX_NAME_FAILED_TOOLTIP_TEXT,
  SUBMIT_BUTTON_DISABLED_TOOLTIP_TEXT,
  USER_PROFILE_FORM_VERSION,
} from "./constants";
import cs from "./user_profile_form.scss";

export function UserProfileForm() {
  const currentUser = useContext(UserContext);
  const history = useHistory();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [selectedUsecaseCheckboxes, setSelectedUsecaseCheckboxes] = useState<
    string[]
  >([]);
  const [selectedReferralCheckboxes, setSelectedReferralCheckboxes] = useState<
    string[]
  >([]);
  const [selectedSequencingExpertise, setSelectedSequencingExpertise] =
    useState<string>();
  const [rorInstitution, setRORInstitution] = useState<string>("");
  const [rorId, setRORId] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [worldBankIncome, setWorldBankIncome] = useState<string>("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(true);

  const areRequiredFieldsFilled = () => {
    return (
      !isEmpty(firstName) &&
      !isEmpty(lastName) &&
      !isEmpty(selectedUsecaseCheckboxes) &&
      !isEmpty(selectedSequencingExpertise) &&
      !isEmpty(rorInstitution) && // rorId is not required if user enters institution not found in ROR
      !isEmpty(country) // worldBankIncome is not required if user enters country not found in World Bank
    );
  };

  // check that firstName and lastName only contain letters, apostrophes, dashes, or spaces
  const nameRegex = /^[- 'a-zA-ZÀ-ÖØ-öø-ÿ]+$/;
  const checkRegexNameCheckIsFailing = () => {
    // check that firstName and lastName are not empty and that they match the name regex
    if (firstName && lastName) {
      const matchingFirstName = Boolean(firstName.match(nameRegex));
      const matchingLastName = Boolean(lastName.match(nameRegex));
      if (!matchingFirstName || !matchingLastName) {
        return true;
      }
    }
  };

  useEffect(() => {
    setIsSubmitDisabled(
      checkRegexNameCheckIsFailing() || !areRequiredFieldsFilled(),
    );
  }, [
    firstName,
    lastName,
    selectedUsecaseCheckboxes,
    selectedSequencingExpertise,
    rorInstitution,
    country,
  ]);

  async function updateUser() {
    await userUpdater({
      userId: currentUser.userId,
      name: `${firstName} ${lastName}`,
      userProfileFormVersion: USER_PROFILE_FORM_VERSION,
    });
  }

  async function postToAirtable() {
    await airtablePost({
      userId: currentUser.userId,
      profileFormVersion: USER_PROFILE_FORM_VERSION,
      firstName: firstName,
      lastName: lastName,
      rorInstitution: rorInstitution,
      rorId: rorId,
      country: country,
      worldBankIncome: worldBankIncome,
      czidUsecases: selectedUsecaseCheckboxes,
      referralSource: selectedReferralCheckboxes,
      expertiseLevel: selectedSequencingExpertise,
    });
  }

  async function handleFormSubmit() {
    await Promise.all([updateUser(), postToAirtable()])
      .then(() => {
        history.push(
          `/${DISCOVERY_DOMAIN_MY_DATA}?profile_form_submitted=true`,
        );
        location.reload();
      })
      .catch(err => {
        alert("post failed: " + err.message);
      });
  }

  const submitButton = () => {
    const button = (
      <Button
        sdsType="primary"
        sdsStyle="rounded"
        onClick={withAnalytics(
          handleFormSubmit,
          ANALYTICS_EVENT_NAMES.USER_PROFILE_FORM_COMPLETE_SETUP_CLICKED,
          {
            userId: currentUser.userId,
          },
        )}
        disabled={isSubmitDisabled}
        data-testid="complete-setup-btn"
      >
        Complete Setup
      </Button>
    );

    if (isSubmitDisabled) {
      return (
        <Tooltip
          arrow
          placement="top"
          title={
            !areRequiredFieldsFilled()
              ? SUBMIT_BUTTON_DISABLED_TOOLTIP_TEXT
              : REGEX_NAME_FAILED_TOOLTIP_TEXT
          }
        >
          <span>{button}</span>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <NarrowContainer className={cs.parentContainer} size="small">
      <form>
        <div className={cs.formTitle}>Finish Setting Up Your Account</div>
        <div className={cs.formSubtitle}>
          Set up your profile so you can start using CZ ID!
        </div>
        <NameField setFirstName={setFirstName} setLastName={setLastName} />
        <CountryFormField
          setCountry={setCountry}
          setWorldBankIncome={setWorldBankIncome}
        />
        <InstitutionFormField
          setInstitution={setRORInstitution}
          setRORId={setRORId}
        />
        <CZIDUsecaseFormField
          selectedUsecaseCheckboxes={selectedUsecaseCheckboxes}
          setSelectedUsecaseCheckboxes={setSelectedUsecaseCheckboxes}
        />
        <SequencingExpertiseFormField
          selectedSequencingExpertise={selectedSequencingExpertise}
          setSelectedSequencingExpertise={setSelectedSequencingExpertise}
        />
        <CZIDReferralFormField
          selectedReferralCheckboxes={selectedReferralCheckboxes}
          setSelectedReferralCheckboxes={setSelectedReferralCheckboxes}
        />
        <div className={cs["submit-button"]}>{submitButton()}</div>
        <div className={cs.linkContainer}>
          You can view our Privacy Policy{" "}
          <Link
            target="_blank"
            rel="noopener"
            href="/privacy"
            className={cs.dataPrivacyLink}
          >
            here.
          </Link>
        </div>
      </form>
    </NarrowContainer>
  );
}
