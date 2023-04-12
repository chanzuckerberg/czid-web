import axios from "axios";
import cx from "classnames";
import React, { useContext, useState } from "react";
import { withAnalytics } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
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

  const userContext = useContext(UserContext);
  const { appConfig } = userContext || {};
  // When auto account creation is enabled, username will no longer be collected nor displayed,
  // for project memebers, invited users will be added to the project with a null username,
  // and the "Add" button will be renamed to "Send Invite"
  const autoAccountCreationEnabled = appConfig.autoAccountCreationEnabled;

  const handleAddUser = () => {
    const fieldsValidation = {
      email: StringHelper.validateEmail(email),
      ...(!autoAccountCreationEnabled && {
        name: StringHelper.validateName(name),
      }),
    };

    const userNameToAdd = autoAccountCreationEnabled ? null : name;
    if (Object.values(fieldsValidation).every(valid => !!valid)) {
      setStatusClass(cs.infoMessage);
      setStatusMessage("Sending invitation");
      axios
        .put(`/projects/${project.id}}/add_user`, {
          user_name_to_add: userNameToAdd,
          user_email_to_add: email,
          authenticity_token: csrf,
        })
        .then(() => {
          onUserAdded(userNameToAdd, email);
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
          {!autoAccountCreationEnabled && (
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
          )}
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
              text={autoAccountCreationEnabled ? "Send Invite" : "Add"}
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
                {autoAccountCreationEnabled
                  ? `${user.email}`
                  : `${user.name} (${user.email})`}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserManagementForm;
