import React from "react";
import PropTypes from "prop-types";

import { logAnalyticsEvent } from "~/api/analytics";
import Checkbox from "~ui/controls/Checkbox";

const UserForm = ({
  archetypes,
  clearError,
  email,
  errorMessage,
  funcName,
  groups,
  institution,
  isAdmin,
  name,
  onAdminChange,
  onAfricaCDCChange,
  onBiohubChange,
  onDPHChange,
  onEmailChange,
  onGCEChange,
  onInstitutionChange,
  onLandscapeExplorerChange,
  onLMICChange,
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
      const form = selectedUser ? "update" : "create";
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
              <div>
                <Checkbox
                  className="checkbox"
                  checked={archetypes.isMedicalDetective}
                  onChange={onMedicalDetectiveChange}
                  label="Medical Detective"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={archetypes.isLandscapeExplorer}
                  onChange={onLandscapeExplorerChange}
                  label="Landscape Explorer"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={archetypes.isOutbreakSurveyor}
                  onChange={onOutbreakSurveyorChange}
                  label="Outbreak Surveyor"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={archetypes.isMicrobiomeInvestigator}
                  onChange={onMicrobiomeInvestigatorChange}
                  label="Microbiome Investigator"
                />
              </div>
            </div>
            <div className="section">
              <div className="header">Group</div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={groups.isDPH}
                  onChange={onDPHChange}
                  label="DPH"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={groups.isGCE}
                  onChange={onGCEChange}
                  label="GCE"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={groups.isAfricaCDC}
                  onChange={onAfricaCDCChange}
                  label="Africa CDC"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={groups.isBiohub}
                  onChange={onBiohubChange}
                  label="Biohub"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={groups.isLMIC}
                  onChange={onLMICChange}
                  label="LMIC"
                />
              </div>
            </div>
            <div className="section">
              <div className="header">Admin</div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={isAdmin}
                  onChange={onAdminChange}
                  label="Admin"
                />
              </div>
            </div>
            {!selectedUser && (
              <div>
                <Checkbox
                  className="checkbox"
                  checked={sendActivation}
                  onChange={onSendActivationChange}
                  label="Send activation email"
                />
              </div>
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
  groups: PropTypes.shape({
    isAfricaCDC: PropTypes.bool,
    isBiohub: PropTypes.bool,
    isDPH: PropTypes.bool,
    isGCE: PropTypes.bool,
    isLMIC: PropTypes.bool,
  }),
  institution: PropTypes.string,
  isAdmin: PropTypes.bool,
  name: PropTypes.string,
  onAdminChange: PropTypes.func,
  onAfricaCDCChange: PropTypes.func,
  onBiohubChange: PropTypes.func,
  onDPHChange: PropTypes.func,
  onEmailChange: PropTypes.func,
  onGCEChange: PropTypes.func,
  onInstitutionChange: PropTypes.func,
  onLandscapeExplorerChange: PropTypes.func,
  onLMICChange: PropTypes.func,
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
