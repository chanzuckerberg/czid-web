import { InputText } from "czifui";
import React from "react";
import cs from "./name_field.scss";

interface NameFieldProps {
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
}

export function NameField({ setFirstName, setLastName }: NameFieldProps) {
  const handleFirstNameInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFirstName(event.target.value);
  };
  const handleLastNameInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLastName(event.target.value);
  };

  return (
    <div className={cs.main}>
      <div className={cs.titleMainText}>Full Name:</div>
      <div className={cs.nameFields}>
        <InputText
          id={"first-name"}
          label={"first-name"}
          sdsType={"textField"}
          placeholder={"First Name"}
          name="input-text-first-name"
          onChange={handleFirstNameInputChange}
          hideLabel={true}
        />
        <InputText
          id={"last-name"}
          label={"last-name"}
          sdsType={"textField"}
          placeholder={"Last Name"}
          name="input-text-last-name"
          onChange={handleLastNameInputChange}
          hideLabel={true}
        />
      </div>
    </div>
  );
}
