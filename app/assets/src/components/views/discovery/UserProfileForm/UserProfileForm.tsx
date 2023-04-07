import React, { useState } from "react";
import CZIDUsecaseFormField from "./components/CZIDUsecaseFormField";
import cs from "./user_profile_form.scss";

export function UserProfileForm() {
  const [selectedUsecaseCheckboxes, setSelectedUsecaseCheckboxes] = useState(
    [],
  );

  return (
    <div className={cs["parent-container"]}>
      <form>
        <CZIDUsecaseFormField
          selectedUsecaseCheckboxes={selectedUsecaseCheckboxes}
          setSelectedUsecaseCheckboxes={setSelectedUsecaseCheckboxes}
        />
      </form>
    </div>
  );
}
