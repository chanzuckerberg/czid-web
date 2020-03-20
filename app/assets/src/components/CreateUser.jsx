import React from "react";
import axios from "axios";

import { openUrl } from "~utils/links";
import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";

class CreateUser extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = props.csrf;
    this.user = props.selectedUser || null;
    this.handleCreate = this.handleCreate.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleInstitutionChange = this.handleInstitutionChange.bind(this);
    this.clearError = this.clearError.bind(this);
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.selectedUser = {
      email: this.user ? this.user.email : "",
      name: this.user ? this.user.name : "",
      institution: this.user ? this.user.institution : "",
      id: this.user ? this.user.id : null,
      adminStatus: this.user ? this.user.admin : null,
    };
    this.state = {
      submitting: false,
      isAdmin: !!this.selectedUser.adminStatus,
      success: false,
      showFailed: false,
      errorMessage: "",
      successMessage: "",
      serverErrors: [],
      email: this.selectedUser.email || "",
      name: this.selectedUser.name || "",
      adminstatus: this.selectedUser.adminStatus,
      id: this.selectedUser.id,
      sendActivation: true,
      institution: this.selectedUser.institution || "",
    };
  }

  handleCreate(e) {
    e.preventDefault();
    if (!this.isCreateFormInvalid()) {
      this.setState({
        submitting: true,
      });
      this.createUser();
    }
  }

  handleUpdate(e) {
    e.preventDefault();
    if (!this.isUpdateFormValid()) {
      this.setState({
        submitting: true,
      });
      this.updateUser();
    }
  }

  clearError() {
    this.setState({ showFailed: false });
  }

  toggleCheckBox(e) {
    this.setState({
      isAdmin: e.target.value !== "true",
      adminstatus: e.target.value !== "true",
    });
  }

  handleEmailChange(e) {
    this.setState({
      email: e.target.value,
    });
  }

  handleNameChange(e) {
    this.setState({
      name: e.target.value,
    });
  }

  handleInstitutionChange(e) {
    this.setState({
      institution: e.target.value,
    });
  }

  isCreateFormInvalid() {
    if (this.state.email === "") {
      this.setState({
        showFailed: true,
        errorMessage: "Please fill all fields",
      });
      return true;
    }
  }

  isUpdateFormValid() {
    if (this.state.email === "") {
      this.setState({
        showFailed: true,
        errorMessage: "Please enter valid email address",
      });
      return true;
    }
  }

  createUser() {
    const { sendActivation } = this.state;
    var that = this;
    axios
      .post(
        "/users.json",
        {
          user: {
            name: this.state.name,
            email: this.state.email,
            institution: this.state.institution,
            role: this.state.isAdmin ? 1 : 0,
            send_activation: sendActivation,
          },
        },
        { headers: { "X-CSRF-TOKEN": this.csrf } }
      )
      .then(res => {
        that.setState(
          {
            submitting: false,
            success: true,
            successMessage: "User created successfully",
          },
          () => {
            openUrl("/users");
          }
        );
      })
      .catch(err => {
        that.setState({
          submitting: false,
          showFailed: true,
          serverErrors: err.response.data,
        });
      });
  }

  updateUser() {
    var that = this;
    axios
      .patch(
        `/users/${this.state.id}.json`,
        {
          user: {
            name: this.state.name,
            email: this.state.email,
            institution: this.state.institution,
            role: this.state.adminstatus ? 1 : 0,
          },
        },
        { headers: { "X-CSRF-TOKEN": this.csrf } }
      )
      .then(res => {
        that.setState(
          {
            success: true,
            submitting: false,
            successMessage: "User updated successfully",
          },
          () => {
            openUrl("/users");
          }
        );
      })
      .catch(err => {
        that.setState({
          showFailed: true,
          submitting: false,
          serverErrors: err.response.data,
        });
      });
  }

  displayError(failedStatus, serverErrors, formattedError) {
    if (failedStatus) {
      const ret = serverErrors.length ? (
        serverErrors.map((error, i) => {
          return (
            <p className="error center-align" key={i}>
              {error}
            </p>
          );
        })
      ) : (
        <span>{formattedError}</span>
      );
      const form = this.props.selectedUser ? "update" : "create";
      logAnalyticsEvent(`CreateUser_${form}-errors_displayed`, {
        form,
        serverErrors,
        formattedError,
      });
      return ret;
    } else {
      return null;
    }
  }

  renderUserForm(submitFunc, funcName) {
    const { selectedUser } = this.props;
    const { sendActivation } = this.state;
    return (
      <div className="user-form">
        <div className="row">
          <form
            ref="form"
            className="new_user"
            id="new_user"
            onSubmit={submitFunc}
          >
            <div className="row title">
              <p className="col s8 signup"> {funcName} User</p>
            </div>
            {this.state.success ? (
              <div className="success-info">
                <i className="fa fa-success" />
                <span>{this.state.successMessage}</span>
              </div>
            ) : null}
            <div className={this.state.showFailed ? "error-info" : ""}>
              {this.displayError(
                this.state.showFailed,
                this.state.serverErrors,
                this.state.errorMessage
              )}
            </div>
            <div className="row content-wrapper">
              <div className="input-field">
                <i className="fa fa-envelope" aria-hidden="true" />
                <input
                  type="email"
                  onChange={withAnalytics(
                    this.handleEmailChange,
                    "CreateUser_email_changed"
                  )}
                  className=""
                  onFocus={this.clearError}
                  value={this.state.email}
                />
                <label htmlFor="user_email">Email</label>
              </div>
              <div className="input-field">
                <i className="fa fa-envelope" aria-hidden="true" />
                <input
                  type="text"
                  onChange={withAnalytics(
                    this.handleNameChange,
                    "CreateUser_name_changed"
                  )}
                  className=""
                  onFocus={this.clearError}
                  value={this.state.name}
                />
                <label htmlFor="user_name">Name</label>
              </div>
              <div className="input-field">
                <i className="fa fa-building" aria-hidden="true" />
                <input
                  type="text"
                  onChange={withAnalytics(
                    this.handleInstitutionChange,
                    "CreateUser_institution_changed"
                  )}
                  onFocus={this.clearError}
                  value={this.state.institution}
                />
                <label>Institution</label>
              </div>
              <p>
                <input
                  type="checkbox"
                  id="admin"
                  className="filled-in"
                  checked={this.state.isAdmin ? "checked" : ""}
                  onChange={withAnalytics(
                    this.toggleCheckBox,
                    "CreateUser_admin_changed"
                  )}
                  value={this.state.isAdmin}
                />
                <label htmlFor="admin">Admin</label>
              </p>
              {!selectedUser && (
                <p>
                  <input
                    type="checkbox"
                    id="sendActivation"
                    className="filled-in"
                    checked={sendActivation ? "checked" : ""}
                    onChange={withAnalytics(() => {
                      this.setState({ sendActivation: !sendActivation });
                    }, "CreateUser_send-activation_changed")}
                    value={sendActivation}
                  />
                  <label htmlFor="sendActivation">Send activation email</label>
                </p>
              )}
            </div>
            <input className="hidden" type="submit" />
            {this.state.submitting ? (
              <div className="center login-wrapper disabled">
                {" "}
                <i className="fa fa-spinner fa-spin fa-lg" />{" "}
              </div>
            ) : (
              <div onClick={submitFunc} className="center login-wrapper">
                Submit
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.props.selectedUser
          ? this.renderUserForm(
              withAnalytics(
                this.handleUpdate,
                "CreateUser_update-form_submitted",
                { form: "Update" }
              )
            )
          : this.renderUserForm(
              withAnalytics(
                this.handleCreate,
                "CreateUser_create-form_submitted",
                { form: "Create" }
              )
            )}
        <div className="bottom">
          <span
            className="back"
            onClick={() =>
              this.props.selectedUser ? openUrl("/users") : openUrl("/")
            }
          >
            Back
          </span>|
          <span className="home" onClick={() => openUrl("/")}>
            Home
          </span>
        </div>
      </div>
    );
  }
}
export default CreateUser;
