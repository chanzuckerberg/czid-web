import { Button } from "czifui";
import { isEmpty } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { updateUser as userUpdater } from "~/api/user";
import { UserContext } from "~/components/common/UserContext";
import { openUrl } from "~/components/utils/links";
import CZIDUsecaseFormField from "./components/CZIDUsecaseFormField";
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
  const [selectedSequencingExpertise, setSelectedSequencingExpertise] =
    useState<string>("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(true);

  const areRequiredFieldsFilled = () => {
    return (
      !isEmpty(firstName) &&
      !isEmpty(lastName) &&
      !isEmpty(selectedUsecaseCheckboxes) &&
      !isEmpty(selectedSequencingExpertise)
    );
  };

  useEffect(() => {
    setIsSubmitDisabled(areRequiredFieldsFilled());
  }, [
    firstName,
    lastName,
    selectedUsecaseCheckboxes,
    selectedSequencingExpertise,
  ]);

  async function updateUser() {
    try {
      await userUpdater({
        userId: currentUser.userId,
        name: `${firstName} ${lastName}`,
        userProfileFormVersion: USER_PROFILE_FORM_VERSION,
      });
      openUrl("/");
    } catch (err) {
      alert("user update failed: " + err.message);
    }
  }

  return (
    <div className={cs["parent-container"]}>
      <form>
        <NameField setFirstName={setFirstName} setLastName={setLastName} />
        <CZIDUsecaseFormField
          selectedUsecaseCheckboxes={selectedUsecaseCheckboxes}
          setSelectedUsecaseCheckboxes={setSelectedUsecaseCheckboxes}
        />
        <SequencingExpertiseFormField
          selectedSequencingExpertise={selectedSequencingExpertise}
          setSelectedSequencingExpertise={setSelectedSequencingExpertise}
        />
        <div className={cs["submit-button"]}>
          <Button
            sdsType="primary"
            sdsStyle="rounded"
            onClick={updateUser}
            disabled={isSubmitDisabled}
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
