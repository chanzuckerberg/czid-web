import React, { useState } from "react";
import CZIDUsecaseFormField from "./components/CZIDUsecaseFormField";
import SequencingExpertiseFormField from "./components/SequencingExpertiseFormField";
import cs from "./user_profile_form.scss";

export function UserProfileForm() {
  const [selectedUsecaseCheckboxes, setSelectedUsecaseCheckboxes] = useState<
    string[]
  >([]);
  const [selectedSequencingExpertise, setSelectedSequencingExpertise] =
    useState<string>();

  return (
    <div className={cs["parent-container"]}>
      <form>
        <CZIDUsecaseFormField
          selectedUsecaseCheckboxes={selectedUsecaseCheckboxes}
          setSelectedUsecaseCheckboxes={setSelectedUsecaseCheckboxes}
        />
        <SequencingExpertiseFormField
          selectedSequencingExpertise={selectedSequencingExpertise}
          setSelectedSequencingExpertise={setSelectedSequencingExpertise}
        />
      </form>
    </div>
  );
}
