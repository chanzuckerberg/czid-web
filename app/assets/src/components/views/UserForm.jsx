import React from "react";
import PropTypes from "prop-types";
import { logAnalyticsEvent } from "~/api/analytics";
import Dropdown from "~ui/controls/dropdowns/Dropdown";

const UserForm = ({
  archetypes,
  clearError,
  email,
  errorMessage,
  funcName,
  group,
  groupOptions,
  institution,
  isAdmin,
  name,
  onAdminChange,
  onEmailChange,
  onGroupChange,
  onInstitutionChange,
  onLandscapeExplorerChange,
  onMedicalDetectiveChange,
  onMicrobiomeInvestigatorChange,
  onNameChange,
  onOutbreakSurveyorChange,
  onSendActivationChange,
  selectedUser,
  sendActivation,
  serverErrors,
  showFailed,
  submitFunc,
  submitting,
  success,
  successMessage,
}) => {
  const displayError = (failedStatus, serverErrors, formattedError) => {
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
  };

  return (
    <div className="user-form">
      <div className="row">
        <form className="new_user" id="new_user" onSubmit={submitFunc}>
          <div className="row title">
            <p className="col s8 signup"> {funcName} User</p>
          </div>
          {success ? (
            <div className="success-info">
              <i className="fa fa-success" />
              <span>{successMessage}</span>
            </div>
          ) : null}
          <div className={showFailed ? "error-info" : ""}>
            {displayError(showFailed, serverErrors, errorMessage)}
          </div>
          <div className="row content-wrapper">
            <div className="input-field">
              <i className="fa fa-envelope" aria-hidden="true" />
              <input
                type="email"
                onChange={onEmailChange}
                className=""
                onFocus={clearError}
                value={email}
              />
              <label htmlFor="user_email">Email</label>
            </div>
            <div className="input-field">
              <i className="fa fa-envelope" aria-hidden="true" />
              <input
                type="text"
                onChange={onNameChange}
                className=""
                onFocus={clearError}
                value={name}
              />
              <label htmlFor="user_name">Name</label>
            </div>
            <div className="input-field">
              <i className="fa fa-building" aria-hidden="true" />
              <input
                type="text"
                onChange={onInstitutionChange}
                onFocus={clearError}
                value={institution}
              />
              <label>Institution</label>
            </div>
            <div className="section">
              <div className="header">Archetypes</div>
              <p>
                <input
                  type="checkbox"
                  id="medicalDetective"
                  className="filled-in"
                  checked={archetypes.isMedicalDetective ? "checked" : ""}
                  onChange={onMedicalDetectiveChange}
                  value={archetypes.isMedicalDetective}
                />
                <label htmlFor="medicalDetective">Medical Detective</label>
              </p>
              <p>
                <input
                  type="checkbox"
                  id="landscapeExplorer"
                  className="filled-in"
                  checked={archetypes.isLandscapeExplorer ? "checked" : ""}
                  onChange={onLandscapeExplorerChange}
                  value={archetypes.isLandscapeExplorer}
                />
                <label htmlFor="landscapeExplorer">Landscape Explorer</label>
              </p>
              <p>
                <input
                  type="checkbox"
                  id="outbreakSurveyor"
                  className="filled-in"
                  checked={archetypes.isOutbreakSurveyor ? "checked" : ""}
                  onChange={onOutbreakSurveyorChange}
                  value={archetypes.isOutbreakSurveyor}
                />
                <label htmlFor="outbreakSurveyor">Outbreak Surveyor</label>
              </p>
              <p>
                <input
                  type="checkbox"
                  id="microbiomeInvestigator"
                  className="filled-in"
                  checked={archetypes.isMicrobiomeInvestigator ? "checked" : ""}
                  onChange={onMicrobiomeInvestigatorChange}
                  value={archetypes.isMicrobiomeInvestigator}
                />
                <label htmlFor="microbiomeInvestigator">
                  Microbiome Investigator
                </label>
              </p>
            </div>
            <div className="section">
              <div className="header">Group</div>
              <Dropdown
                arrowInsideTrigger={false}
                key={0}
                fluid
                options={groupOptions}
                label="Group"
                onChange={onGroupChange}
                value={group}
              />
            </div>
            <p>
              <input
                type="checkbox"
                id="admin"
                className="filled-in"
                checked={isAdmin ? "checked" : ""}
                onChange={onAdminChange}
                value={isAdmin}
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
                  onChange={onSendActivationChange}
                  value={sendActivation}
                />
                <label htmlFor="sendActivation">Send activation email</label>
              </p>
            )}
          </div>
          <input className="hidden" type="submit" />
          {submitting ? (
            <div className="center login-wrapper disabled">
              {" "}
              <i className="fa fa-spinner fa-spin fa-lg" />{" "}
            </div>
          ) : (
            <div onClick={submitFunc()} className="center login-wrapper">
              Submit
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

UserForm.propTypes = {
  archetypes: PropTypes.shape({
    isLandscapeExplorer: PropTypes.bool,
    isMedicalDetective: PropTypes.bool,
    isMicrobiomeInvestigator: PropTypes.bool,
    isOutbreakSurveyor: PropTypes.bool,
  }),
  clearError: PropTypes.func,
  email: PropTypes.string,
  errorMessage: PropTypes.string,
  funcName: PropTypes.string,
  group: PropTypes.string,
  groupOptions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      value: PropTypes.string,
    })
  ),
  institution: PropTypes.string,
  isAdmin: PropTypes.bool,
  name: PropTypes.string,
  onAdminChange: PropTypes.func,
  onEmailChange: PropTypes.func,
  onGroupChange: PropTypes.func,
  onInstitutionChange: PropTypes.func,
  onLandscapeExplorerChange: PropTypes.func,
  onMedicalDetectiveChange: PropTypes.func,
  onMicrobiomeInvestigatorChange: PropTypes.func,
  onNameChange: PropTypes.func,
  onOutbreakSurveyorChange: PropTypes.func,
  onSendActivationChange: PropTypes.func,
  selectedUser: PropTypes.object,
  sendActivation: PropTypes.bool,
  serverErrors: PropTypes.array,
  showFailed: PropTypes.bool,
  submitFunc: PropTypes.func,
  submitting: PropTypes.bool,
  success: PropTypes.bool,
  successMessage: PropTypes.string,
};

export default UserForm;
