import axios from "axios";
import cx from "classnames";
import React, { useState } from "react";

import { withAnalytics } from "~/api/analytics";
import StringHelper from "~/helpers/StringHelper";
import { Input } from "~ui/controls";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";

import cs from "./user_management_form.scss";

interface UserManagementFormProps {
  csrf?: string;
  onUserAdded?: $TSFixMeFunction;
  project: {
    id?: number;
    name?: string;
    public_access?: boolean | number;
  };
  users?: { name: string; email: string }[];
}

const UserManagementForm = ({
  users,
  csrf,
  onUserAdded,
  project,
}: UserManagementFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusClass, setStatusClass] = useState(null);

  const handleAddUser = () => {
    const fieldsValidation = {
      email: StringHelper.validateEmail(email),
      name: StringHelper.validateName(name),
    };

    if (Object.values(fieldsValidation).every(valid => !!valid)) {
      setStatusClass(cs.infoMessage);
      setStatusMessage("Sending invitation");
      axios
        .put(`/projects/${project.id}}/add_user`, {
          user_name_to_add: name,
          user_email_to_add: email,
          authenticity_token: csrf,
        })
        .then(() => {
          onUserAdded(name, email);
          setName("");
          setEmail("");
          setStatusMessage("Invitation sent! User added.");
          setStatusClass(cs.successMessage);
        });
    } else {
      const invalidFieldsString = Object.keys(fieldsValidation)
        .filter(fieldName => !fieldsValidation[fieldName])
        .join(" and ");
      setStatusClass(cs.errorMessage);
      setStatusMessage(`Invalid ${invalidFieldsString}`);
    }
  };

  const handleChangeName = (name: string) => {
    setName(name);
    setStatusMessage("");
    setStatusClass(cs.infoMessage);
  };

  const handleChangeEmail = (email: string) => {
    setEmail(email);
    setStatusMessage("");
    setStatusClass(cs.infoMessage);
  };

  return (
    <div className={cs.userManagementForm}>
      <div className={cs.title}>Project Members</div>
      <div className={cs.note}>
        Project members have full access to editing your project and project
        actions.
      </div>
      <div className={cx(cs.userManagementBody, cs.background)}>
        <div className={cs.addMemberForm}>
          <div className={cs.addMemberFormField}>
            <div className={cs.label}>Full Name</div>
            <Input
              fluid
              type="text"
              id="fullName"
              onChange={handleChangeName}
              value={name}
            />
          </div>
          <div className={cs.addMemberFormField}>
            <div className={cs.label}>Email</div>
            <Input
              fluid
              type="text"
              id="email"
              onChange={handleChangeEmail}
              value={email}
            />
          </div>
          <div className={cs.addMemberFormField}>
            <SecondaryButton
              className={cs.button}
              text="Add"
              rounded={false}
              onClick={withAnalytics(
                handleAddUser,
                "UserManagementForm_add-member-button_clicked",
              )}
            />
          </div>
        </div>
        {statusMessage && (
          <div className={cx(cs.statusMessage, statusClass)}>
            {statusMessage}
          </div>
        )}
        <div className={cs.userList}>
          {users.map(user => {
            return (
              <div className={cs.userEntry} key={user.email}>
                {user.name} ({user.email})
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserManagementForm;
