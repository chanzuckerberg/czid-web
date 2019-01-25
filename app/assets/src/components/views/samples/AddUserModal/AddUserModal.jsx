import React from "react";
import PropTypes from "prop-types";
import Modal from "~ui/containers/Modal";
import PrimaryButton from "~ui/controls/buttons/PrimaryButton";
// import Input from "~/components/ui/controls/Input";
// TODO: Remove use of Form
import { Form } from "semantic-ui-react";
import StringHelper from "~/helpers/StringHelper";
import cs from "./add_user_modal.scss";
import axios from "axios";

class AddUserModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inviteStatus: "",
      email: "",
      emailValidation: "",
      modalOpen: false,
      name: "",
      projectPublic: this.props.project.publicAccess
    };
  }

  openModal = () => this.setState({ modalOpen: true });
  closeModal = () => this.setState({ modalOpen: false });

  toggleProjectVisibility = () => {
    const { csrf, project } = this.props;

    // TODO: rethink where this should go
    axios
      .put(`/projects/${project}.json`, {
        public_access: !this.state.projectPublic,
        authenticity_token: csrf
      })
      .then(() => {
        this.setState({
          projectPublic: !this.state.projectPublic
        });
      })
      .catch(() => {
        // TODO: Proper error within the module? Or proper toast?
        console.log(
          `FIX THIS: Unable to change project visibility for '${
            this.state.project.name
          }'`
        );
        // Materialize.toast(
        //   `Unable to change project visibility for '${
        //     this.state.project.name
        //   }'`,
        //   3000,
        //   "rounded"
        // );
      });
  };

  render() {
    const { project } = this.props;
    return (
      <div>
        <div className={cs.trigger} onClick={this.openModal}>
          Settings
        </div>
        {this.state.modalOpen && (
          <Modal
            open
            onClose={this.closeModal}
            className="modal project-popup add-user-modal"
          >
            <div className="project_modal_header">
              {project.name} Members and Access Control
            </div>
            <div className="modal-content">
              <div className="project_modal_visibility">
                {project.public_access ? (
                  <span>
                    <i className="tiny material-icons">lock_open</i>
                    <span className="label">Public Project</span>
                  </span>
                ) : (
                  <span>
                    <div>
                      <i className="tiny material-icons">lock</i>
                      <span className="label">Private Project</span>
                    </div>
                    <div>
                      <a href="#" onClick={this.toggleProjectVisibility}>
                        Make public
                      </a>
                    </div>
                  </span>
                )}
              </div>
              <UserManagementForm users={this.props.users} parent={this} />
            </div>
          </Modal>
        )}
      </div>
    );
  }
}

AddUserModal.propTypes = {
  csrf: PropTypes.string.isRequired,
  onUserAdded: PropTypes.func,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    public_acces: PropTypes.bool
  }).isRequired,
  users: PropTypes.array
};

function UserManagementForm({ users, parent }) {
  const handleAddUser = (name, email) => {
    const { csrf, onUserAdded, project } = parent.props;

    if (StringHelper.validateEmail(email) && StringHelper.validateName(name)) {
      this.setState({
        emailValidation: null,
        inviteStatus: "sending"
      });
      axios
        .put(`/projects/${project.id}}/add_user`, {
          user_name_to_add: name,
          user_email_to_add: email,
          authenticity_token: csrf
        })
        .then(() => {
          onUserAdded({ name, email });
          this.setState({
            inviteStatus: "sent"
          });
        });
    } else {
      this.setState({
        emailValidation: "Invalid name or email address"
      });
    }
  };

  return (
    <div>
      <div className="members_list">
        <div className="list_title">
          <i className="tiny material-icons">person_add</i> Project Members
        </div>
        <ul>
          {users.length > 0 ? (
            users.map(user => {
              return (
                <li key={user.email}>
                  {user.name} ({user.email})
                </li>
              );
            })
          ) : (
            <li key="None">None</li>
          )}
        </ul>
      </div>
      <div className="add_member row">
        {/* <div>
          <Input type="text" onChange={this.handleChangedUser} />
        </div>
        <div>
        </div> */}
        <Form onSubmit={parent.handleSubmit}>
          <Form.Group>
            <Form.Input
              placeholder="Name"
              id="add_user_to_project_name"
              type="text"
              onChange={parent.handleChange}
            />
            <Form.Input
              placeholder="Email"
              id="add_user_to_project_email"
              type="email"
              onChange={parent.handleChange}
            />
          </Form.Group>
          <PrimaryButton text="Add member" onClick={handleAddUser} />
        </Form>
        <div className="error-message">{parent.state.emailValidation}</div>
        {parent.state.inviteStatus === "sending" ? (
          <div className="status-message">
            <i className="fa fa-circle-o-notch fa-spin fa-fw" />
            Hang tight, sending invitation...
          </div>
        ) : null}
        {parent.state.inviteStatus === "sent" ? (
          <div className="status-message status teal-text text-darken-2">
            <i className="fa fa-smile-o fa-fw" />
            User has been added
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AddUserModal;
