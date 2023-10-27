import React from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import Archetypes from "~/interface/archetypes";
import Segments from "~/interface/segments";
import Checkbox from "~ui/controls/Checkbox";
import Input from "~ui/controls/Input";
import cs from "./user_form.scss";

const UserForm = ({
  archetypes,
  email,
  errorMessage,
  segments,
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
  serverErrors,
  showFailed,
  submitFunc,
  submitting,
  success,
  successMessage,
}: UserFormProps) => {
  const trackEvent = useTrackEvent();
  const displayError = (failedStatus, serverErrors, formattedError) => {
    if (failedStatus) {
      const ret =
        serverErrors && serverErrors.length ? (
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
      trackEvent(ANALYTICS_EVENT_NAMES.UPDATE_USER_UPDATE_ERRORS_DISPLAYED, {
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
            <p className="col s8 signup"> Update User</p>
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
            <div className="section">
              <div className="header">Email</div>
              <Input
                className={cs.inputField}
                defaultValue={email}
                onChange={onEmailChange}
                placeholder="Email"
                type="email"
              />
              <div className="header">Name</div>
              <Input
                className={cs.inputField}
                defaultValue={name}
                onChange={onNameChange}
                placeholder="Name"
                type="text"
              />
              <div className="header">Institution</div>
              <Input
                className={cs.inputField}
                defaultValue={institution}
                onChange={onInstitutionChange}
                placeholder="Institution"
                type="text"
              />
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
              <div className="header">Segments</div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={segments.isDPH}
                  onChange={onDPHChange}
                  label="DPH"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={segments.isGCE}
                  onChange={onGCEChange}
                  label="GCE"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={segments.isAfricaCDC}
                  onChange={onAfricaCDCChange}
                  label="Africa CDC"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={segments.isBiohub}
                  onChange={onBiohubChange}
                  label="Biohub"
                />
              </div>
              <div>
                <Checkbox
                  className="checkbox"
                  checked={segments.isLMIC}
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
          </div>
          <input className="hidden" type="submit" />
          {submitting ? (
            <div className="center login-wrapper disabled">
              {" "}
              <i className="fa fa-spinner fa-spin fa-lg" />{" "}
            </div>
          ) : (
            // @ts-expect-error Type 'unknown' is not assignable to type 'MouseEventHandler<HTMLDivElement>'.
            <button onClick={submitFunc()} className="center login-wrapper">
              Submit
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

interface UserFormProps {
  archetypes: Archetypes;
  clearError: $TSFixMeFunction;
  email: string;
  errorMessage: string;
  segments: Segments;
  institution: string;
  isAdmin: boolean;
  name: string;
  onAdminChange: $TSFixMeFunction;
  onAfricaCDCChange: $TSFixMeFunction;
  onBiohubChange: $TSFixMeFunction;
  onDPHChange: $TSFixMeFunction;
  onEmailChange: $TSFixMeFunction;
  onGCEChange: $TSFixMeFunction;
  onInstitutionChange: $TSFixMeFunction;
  onLandscapeExplorerChange: $TSFixMeFunction;
  onLMICChange: $TSFixMeFunction;
  onMedicalDetectiveChange: $TSFixMeFunction;
  onMicrobiomeInvestigatorChange: $TSFixMeFunction;
  onNameChange: $TSFixMeFunction;
  onOutbreakSurveyorChange: $TSFixMeFunction;
  serverErrors: $TSFixMe[];
  showFailed: boolean;
  submitFunc: $TSFixMeFunction;
  submitting: boolean;
  success: boolean;
  successMessage: string;
}

export default UserForm;
