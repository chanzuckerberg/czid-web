import axios from "axios";
import cx from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { withAnalytics } from "~/api/analytics";
import StringHelper from "~/helpers/StringHelper";
import { Input } from "~ui/controls";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";

import cs from "./user_management_form.scss";

class UserManagementForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      email: "",
      statusMessage: "",
      statusClass: null,
    };
  }

  handleAddUser = () => {
    const { csrf, onUserAdded, project } = this.props;
    const { name, email } = this.state;

    const fieldsValidation = {
      email: StringHelper.validateEmail(email),
      name: StringHelper.validateName(name),
    };

    if (Object.values(fieldsValidation).every(valid => !!valid)) {
      this.setState({
        statusClass: cs.infoMessage,
        statusMessage: "Sending invitation",
      });
      axios
        .put(`/projects/${project.id}}/add_user`, {
          user_name_to_add: name,
          user_email_to_add: email,
          authenticity_token: csrf,
        })
        .then(() => {
          onUserAdded(name, email);
          this.setState({
            statusClass: cs.successMessage,
            statusMessage: "Invitation sent! User added.",
            name: "",
            email: "",
          });
        });
    } else {
      let invalidFieldsString = Object.keys(fieldsValidation)
        .filter(fieldName => !fieldsValidation[fieldName])
        .join(" and ");

      this.setState({
        statusClass: cs.errorMessage,
        statusMessage: `Invalid ${invalidFieldsString} address`,
      });
    }
  };

  handleChangeName = name => {
    this.setState({
      name,
      statusClass: cs.infoMessage,
      statusMessage: "",
    });
  };

  handleChangeEmail = email => {
    this.setState({
      email,
      statusClass: cs.infoMessage,
      statusMessage: "",
    });
  };

  render() {
    const { users } = this.props;
    const { statusMessage, statusClass, email, name } = this.state;

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
                onChange={this.handleChangeName}
                value={name}
              />
            </div>
            <div className={cs.addMemberFormField}>
              <div className={cs.label}>Email</div>
              <Input
                fluid
                type="text"
                id="email"
                onChange={this.handleChangeEmail}
                value={email}
              />
            </div>
            <div className={cs.addMemberFormField}>
              <SecondaryButton
                className={cs.button}
                text="Add"
                rounded={false}
                onClick={withAnalytics(
                  this.handleAddUser,
                  "UserManagementForm_add-member-button_clicked"
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
  }
}

UserManagementForm.propTypes = {
  csrf: PropTypes.string,
  onUserAdded: PropTypes.func,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    public_access: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  }).isRequired,
  users: PropTypes.array,
};

export default UserManagementForm;
