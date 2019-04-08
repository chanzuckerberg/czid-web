import React from "react";
import axios from "axios";

import { openUrl } from "~utils/links";
import { withAnalytics } from "~/api";

class CreateUser extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.csrf = props.csrf;
    this.user = props.selectedUser || null;
    this.handleCreate = this.handleCreate.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handlePConfirmChange = this.handlePConfirmChange.bind(this);
    this.handleInstitutionChange = this.handleInstitutionChange.bind(this);
    this.clearError = this.clearError.bind(this);
    this.toggleCheckBox = this.toggleCheckBox.bind(this);
    this.selectedUser = {
      email: this.user ? this.user.email : "",
      name: this.user ? this.user.name : "",
      institution: this.user ? this.user.institution : "",
      password: "",
      id: this.user ? this.user.id : null,
      password_confirmation: "",
      adminStatus: this.user ? this.user.admin : null
    };
    this.state = {
      submitting: false,
      isAdmin: this.selectedUser.adminStatus ? true : false,
      success: false,
      showFailed: false,
      errorMessage: "",
      successMessage: "",
      serverErrors: [],
      email: this.selectedUser.email || "",
      name: this.selectedUser.name || "",
      password: this.selectedUser.password || "",
      pConfirm: this.selectedUser.password_confirmation || "",
      adminstatus: this.selectedUser.adminStatus,
      id: this.selectedUser.id
    };
  }

  handleCreate(e) {
    e.preventDefault();
    if (!this.isCreateFormInvalid()) {
      this.setState({
        submitting: true
      });
      this.createUser();
    }
  }

  handleUpdate(e) {
    e.preventDefault();
    if (!this.isUpdateFormValid()) {
      this.setState({
        submitting: true
      });
      this.updateUser();
    }
  }

  clearError() {
    this.setState({ showFailed: false });
  }

  toggleCheckBox(e) {
    this.setState({
      isAdmin: e.target.value == "true" ? false : true,
      adminstatus: e.target.value == "true" ? false : true
    });
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value
    });
  }

  handlePConfirmChange(e) {
    this.setState({
      pConfirm: e.target.value
    });
  }

  handleEmailChange(e) {
    this.setState({
      email: e.target.value
    });
  }

  handleNameChange(e) {
    this.setState({
      name: e.target.value
    });
  }

  handleInstitutionChange(e) {
    this.setState({
      institution: e.target.value
    });
  }

  isCreateFormInvalid() {
    if (
      this.state.email === "" &&
      this.state.password === "" &&
      this.state.password_confirmation === ""
    ) {
      this.setState({
        showFailed: true,
        errorMessage: "Please fill all fields"
      });
      return true;
    } else if (this.state.password === "") {
      this.setState({
        showFailed: true,
        errorMessage: "Please enter password"
      });
      return true;
    } else if (this.state.password_confirmation === "") {
      this.setState({
        showFailed: true,
        errorMessage: "Please re-enter password"
      });
      return true;
    } else {
      return false;
    }
  }

  isUpdateFormValid() {
    if (this.state.email === "") {
      this.setState({
        showFailed: true,
        errorMessage: "Please enter valid email address"
      });
      return true;
    } else {
      return false;
    }
  }

  createUser() {
    var that = this;
    axios
      .post(
        "/users.json",
        {
          user: {
            name: this.state.name,
            email: this.state.email,
            institution: this.state.institution,
            password: this.state.password,
            password_confirmation: this.state.password_confirmation,
            role: this.state.isAdmin ? 1 : 0
          }
        },
        { headers: { "X-CSRF-TOKEN": this.csrf } }
      )
      .then(res => {
        that.setState(
          {
            submitting: false,
            success: true,
            successMessage: "User created successfully"
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
          serverErrors: err.response.data
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
            password: this.state.password,
            password_confirmation: this.state.pConfirm,
            role: this.state.adminstatus ? 1 : 0
          }
        },
        { headers: { "X-CSRF-TOKEN": this.csrf } }
      )
      .then(res => {
        that.setState(
          {
            success: true,
            submitting: false,
            successMessage: "User updated successfully"
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
          serverErrors: err.response.data
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
      logAnalyticsEvent(`CreateUser_${form}_errors_displayed`, {
        serverErrors: serverErrors,
        errorMessage: formattedError
      });
      return ret;
    } else {
      return null;
    }
  }

  renderUserForm(submitFunc, funcName) {
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
                    "CreateUser_email_changed",
                    {
                      email: this.state.email
                    }
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
                    "CreateUser_name_changed",
                    {
                      name: this.state.name
                    }
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
                    "CreateUser_institution_changed",
                    {
                      institution: this.state.institution
                    }
                  )}
                  onFocus={this.clearError}
                  value={this.state.institution}
                />
                <label>Institution</label>
              </div>
              <div className="input-field">
                <i className="fa fa-key" aria-hidden="true" />
                <input
                  type="password"
                  onChange={withAnalytics(
                    this.handlePasswordChange,
                    "CreateUser_password_changed",
                    {
                      password: this.state.password
                    }
                  )}
                  className=""
                  onFocus={this.clearError}
                  value={this.state.password}
                />
                <label htmlFor="user_password">Password</label>
              </div>
              <div className="input-field">
                <i className="fa fa-check-circle" aria-hidden="true" />
                <input
                  type="password"
                  onChange={withAnalytics(
                    this.handlePConfirmChange,
                    "CreateUser_pconfirm_changed",
                    {
                      p_confirm: this.state.pConfirm
                    }
                  )}
                  className=""
                  onFocus={this.clearError}
                  value={this.state.pConfirm}
                />
                <label htmlFor="user_password_confirmation">
                  Confirm Password
                </label>
              </div>
              <p>
                <input
                  type="checkbox"
                  id="admin"
                  className="filled-in"
                  checked={this.state.isAdmin ? "checked" : ""}
                  onChange={withAnalytics(
                    this.toggleCheckBox,
                    "CreateUser_admin_changed",
                    {
                      admin: this.state.isAdmin
                    }
                  )}
                  value={this.state.isAdmin}
                />
                <label htmlFor="admin">Admin</label>
              </p>
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
                "CreateUser_update_form_submitted",
                "Update"
              )
            )
          : this.renderUserForm(
              withAnalytics(
                this.handleCreate,
                "CreateUser_create_form_submitted",
                "Create"
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
