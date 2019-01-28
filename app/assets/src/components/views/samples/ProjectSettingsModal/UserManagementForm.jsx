import React from "react";
import PropTypes from "prop-types";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import { Input } from "~ui/controls";
import StringHelper from "~/helpers/StringHelper";
import cs from "./user_management_form.scss";
import cx from "classnames";
import axios from "axios";
import UserIcon from "~ui/icons/UserIcon";

class UserManagementForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      email: "",
      statusMessage: "",
      statusClass: null
    };
  }

  handleAddUser = () => {
    const { csrf, onUserAdded, project } = this.props;
    const { name, email } = this.state;

    const fieldsValidation = {
      email: StringHelper.validateEmail(email),
      name: StringHelper.validateName(name)
    };

    if (Object.values(fieldsValidation).every(valid => !!valid)) {
      this.setState({
        statusClass: cs.infoMessage,
        statusMessage: "Sending invitation"
      });
      axios
        .put(`/projects/${project.id}}/add_user`, {
          user_name_to_add: name,
          user_email_to_add: email,
          authenticity_token: csrf
        })
        .then(() => {
          onUserAdded(name, email);
          this.setState({
            statusClass: cs.successMessage,
            statusMessage: "Invitation sent! User added.",
            name: "",
            email: ""
          });
        });
    } else {
      let invalidFieldsString = Object.keys(fieldsValidation)
        .filter(fieldName => !fieldsValidation[fieldName])
        .join(" and ");

      this.setState({
        statusClass: cs.errorMessage,
        statusMessage: `Invalid ${invalidFieldsString} address`
      });
    }
  };

  handleChangeName = name => {
    this.setState({
      name,
      statusClass: cs.infoMessage,
      statusMessage: ""
    });
  };

  handleChangeEmail = email => {
    this.setState({
      email,
      statusClass: cs.infoMessage,
      statusMessage: ""
    });
  };

  render() {
    const { users } = this.props;
    return (
      <div className={cs.userManagementForm}>
        <div className={cs.title}>
          <UserIcon className={cs.icon} />
          Project Members
        </div>
        <div className={cs.userList}>
          {users.length > 0 ? (
            users.map(user => {
              return (
                <div className={cs.userEntry} key={user.email}>
                  {user.name} ({user.email})
                </div>
              );
            })
          ) : (
            <div className={cs.userEntry} key="None">
              None
            </div>
          )}
        </div>
        <div className={cs.fillIn} />
        <div className={cx(cs.statusMessage, this.state.statusClass)}>
          {this.state.statusMessage}
        </div>
        <div className={cs.addMemberForm}>
          <div className={cs.addMemberFormField}>
            <Input
              fluid
              type="text"
              placeholder="Full Name"
              onChange={this.handleChangeName}
              value={this.state.name}
            />
          </div>
          <div className={cs.addMemberFormField}>
            <Input
              fluid
              type="text"
              placeholder="Email"
              onChange={this.handleChangeEmail}
              value={this.state.email}
            />
          </div>
          <div className={cs.addMemberFormField}>
            <PrimaryButton text="Add member" onClick={this.handleAddUser} />
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
    public_access: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
  }).isRequired,
  users: PropTypes.array
};

export default UserManagementForm;
