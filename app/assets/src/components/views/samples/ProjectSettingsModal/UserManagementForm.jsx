import React from "react";
import PropTypes from "prop-types";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
import { Input } from "~ui/controls";
import StringHelper from "~/helpers/StringHelper";
import cs from "./user_management_form.scss";
import cx from "classnames";
import axios from "axios";
import UserIcon from "../../../ui/icons/UserIcon";

class UserManagementForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      email: "",
      statusMessage: "",
      statusClass: null
    };
  }

  handleAddUser = () => {
    const { csrf, onUserAdded, project } = this.props;
    const { username, email } = this.state;

    if (StringHelper.validateEmail(email) && StringHelper.validateName(name)) {
      this.setState({
        statusClass: cs.infoMessage,
        statusMessage: "Sending invitation"
      });
      axios
        .put(`/projects/${project.id}}/add_user`, {
          user_name_to_add: username,
          user_email_to_add: email,
          authenticity_token: csrf
        })
        .then(() => {
          onUserAdded({ username, email });
          this.setState({
            inviteStatus: "Invitation sent! User added."
          });
        });
    } else {
      this.setState({
        statusClass: cs.errorMessage,
        statusMessage: "Invalid name or email address"
      });
    }
  };

  handleChangeUsername = username => {
    this.setState({
      username,
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
              type="text"
              onChange={this.handleChangeUsername}
              value={this.state.username}
            />
          </div>
          <div className={cs.addMemberFormField}>
            <Input
              type="text"
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
