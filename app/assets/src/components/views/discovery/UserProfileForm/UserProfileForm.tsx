import { Button, Link } from "czifui";
import { isEmpty } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import {
  postToAirtable as airtablePost,
  updateUserData as userUpdater,
} from "~/api/user";
import { UserContext } from "~/components/common/UserContext";
import { openUrl } from "~/components/utils/links";
import CountryFormField from "./components/CountryFormField";
import CZIDReferralFormField from "./components/CZIDReferralFormField";
import CZIDUsecaseFormField from "./components/CZIDUsecaseFormField";
import InstitutionFormField from "./components/InstitutionFormField";
import NameField from "./components/NameField";
import SequencingExpertiseFormField from "./components/SequencingExpertiseFormField";
import { USER_PROFILE_FORM_VERSION } from "./constants";
import cs from "./user_profile_form.scss";

export function UserProfileForm() {
  const currentUser = useContext(UserContext);
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

  useEffect(() => {
    setIsSubmitDisabled(!areRequiredFieldsFilled());
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
      signUpPath: `POST /user/${currentUser.userId}/post_user_data_to_airtable`,
    });
  }

  async function handleFormSubmit() {
    try {
      await Promise.all([updateUser(), postToAirtable()]);
      openUrl("/");
    } catch (err) {
      alert("post failed: " + err.message);
    }
  }

  return (
    <div className={cs.parentContainer}>
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
        <div className={cs["submit-button"]}>
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
          >
            Complete Setup
          </Button>
        </div>
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
    </div>
  );
}
