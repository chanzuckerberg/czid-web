import { includes } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { withAnalytics } from "~/api/analytics";
import { createUser, updateUser } from "~/api/user";
import UserForm from "~/components/views/users/UserForm";
import { openUrl } from "~utils/links";

const DPH = "DPH";
const GCE = "GCE";
const AFRICA_CDC = "Africa CDC";
const BIOHUB = "Biohub";
const LMIC = "LMIC";

const MEDICAL_DETECTIVE = "Medical Detective";
const LANDSCAPE_EXPLORER = "Landscape Explorer";
const OUTBREAK_SURVEYOR = "Outbreak Surveyor";
const MICROBIOME_INVESTIGATOR = "Microbiome Investigator";

class CreateUser extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.user = props.selectedUser || null;
    this.selectedUser = {
      email: this.user ? this.user.email : "",
      name: this.user ? this.user.name : "",
      institution: this.user ? this.user.institution : "",
      id: this.user ? this.user.id : null,
      adminStatus: this.user ? this.user.admin : null,
      archetypes: this.user ? this.user.archetypes : [],
      group: this.user ? this.user.group : null,
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
      id: this.selectedUser.id,
      sendActivation: true,
      institution: this.selectedUser.institution || "",
      isMedicalDetective: includes(
        MEDICAL_DETECTIVE,
        this.selectedUser.archetypes
      ),
      isLandscapeExplorer: includes(
        LANDSCAPE_EXPLORER,
        this.selectedUser.archetypes
      ),
      isOutbreakSurveyor: includes(
        OUTBREAK_SURVEYOR,
        this.selectedUser.archetypes
      ),
      isMicrobiomeInvestigator: includes(
        MICROBIOME_INVESTIGATOR,
        this.selectedUser.archetypes
      ),
      isAfricaCDC: includes(AFRICA_CDC, this.selectedUser.group),
      isBiohub: includes(BIOHUB, this.selectedUser.group),
      isDPH: includes(DPH, this.selectedUser.group),
      isGCE: includes(GCE, this.selectedUser.group),
      isLMIC: includes(LMIC, this.selectedUser.group),
    };
  }

  handleCreate = () => {
    if (!this.isCreateFormInvalid()) {
      this.setState({
        submitting: true,
      });
      this.createUser();
    }
  };

  handleUpdate = () => {
    if (!this.isUpdateFormValid()) {
      this.setState({
        submitting: true,
      });
      this.updateUser();
    }
  };

  clearError = () => {
    this.setState({ showFailed: false });
  };

  handleEmailChange = email => this.setState({ email });

  handleNameChange = name => this.setState({ name });

  handleInstitutionChange = institution => this.setState({ institution });

  getArchetypes = () => {
    const {
      isMedicalDetective,
      isLandscapeExplorer,
      isOutbreakSurveyor,
      isMicrobiomeInvestigator,
    } = this.state;
    let archetypes = [];
    if (isMedicalDetective) {
      archetypes.push(MEDICAL_DETECTIVE);
    }
    if (isLandscapeExplorer) {
      archetypes.push(LANDSCAPE_EXPLORER);
    }
    if (isOutbreakSurveyor) {
      archetypes.push(OUTBREAK_SURVEYOR);
    }
    if (isMicrobiomeInvestigator) {
      archetypes.push(MICROBIOME_INVESTIGATOR);
    }
    return JSON.stringify(archetypes);
  };

  getGroups = () => {
    const { isAfricaCDC, isBiohub, isDPH, isGCE, isLMIC } = this.state;
    let groups = [];
    if (isAfricaCDC) {
      groups.push(AFRICA_CDC);
    }
    if (isBiohub) {
      groups.push(BIOHUB);
    }
    if (isDPH) {
      groups.push(DPH);
    }
    if (isGCE) {
      groups.push(GCE);
    }
    if (isLMIC) {
      groups.push(LMIC);
    }
    return JSON.stringify(groups);
  };

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

  createUser = async () => {
    const { name, email, institution, isAdmin, sendActivation } = this.state;
    const archetypes = this.getArchetypes();
    const group = this.getGroups();
    try {
      await createUser({
        name,
        email,
        institution,
        isAdmin,
        sendActivation,
        archetypes,
        group,
      });
      this.setState(
        {
          submitting: false,
          success: true,
          successMessage: "User created successfully",
        },
        () => {
          openUrl("/users");
        }
      );
    } catch (err) {
      this.setState({
        submitting: false,
        showFailed: true,
        serverErrors: err.data,
      });
    }
  };

  async updateUser() {
    const { name, email, institution, isAdmin, id } = this.state;
    const archetypes = this.getArchetypes();
    const group = this.getGroups();
    try {
      await updateUser({
        userId: id,
        name,
        email,
        institution,
        isAdmin,
        archetypes,
        group,
      });
      this.setState(
        {
          submitting: false,
          success: true,
          successMessage: "User updated successfully",
        },
        () => {
          openUrl("/users");
        }
      );
    } catch (err) {
      this.setState({
        submitting: false,
        showFailed: true,
        serverErrors: err.data,
      });
    }
  }

  render() {
    const { selectedUser } = this.props;
    const {
      email,
      errorMessage,
      institution,
      isAdmin,
      isAfricaCDC,
      isBiohub,
      isDPH,
      isGCE,
      isLandscapeExplorer,
      isLMIC,
      isMedicalDetective,
      isMicrobiomeInvestigator,
      isOutbreakSurveyor,
      name,
      sendActivation,
      serverErrors,
      showFailed,
      submitting,
      success,
      successMessage,
    } = this.state;

    const submitFunc = selectedUser
      ? () =>
          withAnalytics(this.handleUpdate, "CreateUser_update-form_submitted", {
            form: "Update",
          })
      : () =>
          withAnalytics(this.handleCreate, "CreateUser_create-form_submitted", {
            form: "Create",
          });
    const funcName = selectedUser ? "Update" : "Create";

    return (
      <div>
        <UserForm
          archetypes={{
            isMedicalDetective,
            isLandscapeExplorer,
            isOutbreakSurveyor,
            isMicrobiomeInvestigator,
          }}
          clearError={this.clearError}
          email={email}
          errorMessage={errorMessage}
          funcName={funcName}
          groups={{
            isAfricaCDC,
            isBiohub,
            isDPH,
            isGCE,
            isLMIC,
          }}
          institution={institution}
          isAdmin={isAdmin}
          name={name}
          onAdminChange={withAnalytics(() => {
            this.setState({ isAdmin: !isAdmin });
          }, "CreateUser_admin_changed")}
          onAfricaCDCChange={() => this.setState({ isAfricaCDC: !isAfricaCDC })}
          onBiohubChange={() => this.setState({ isBiohub: !isBiohub })}
          onDPHChange={() => this.setState({ isDPH: !isDPH })}
          onEmailChange={withAnalytics(
            this.handleEmailChange,
            "CreateUser_email_changed"
          )}
          onGCEChange={() => this.setState({ isGCE: !isGCE })}
          onInstitutionChange={withAnalytics(
            this.handleInstitutionChange,
            "CreateUser_institution_changed"
          )}
          onLandscapeExplorerChange={() =>
            this.setState({ isLandscapeExplorer: !isLandscapeExplorer })
          }
          onLMICChange={() => this.setState({ isLMIC: !isLMIC })}
          onMedicalDetectiveChange={() =>
            this.setState({ isMedicalDetective: !isMedicalDetective })
          }
          onMicrobiomeInvestigatorChange={() =>
            this.setState({
              isMicrobiomeInvestigator: !isMicrobiomeInvestigator,
            })
          }
          onNameChange={withAnalytics(
            this.handleNameChange,
            "CreateUser_name_changed"
          )}
          onOutbreakSurveyorChange={() =>
            this.setState({ isOutbreakSurveyor: !isOutbreakSurveyor })
          }
          onSendActivationChange={withAnalytics(() => {
            this.setState({ sendActivation: !sendActivation });
          }, "CreateUser_send-activation_changed")}
          selectedUser={selectedUser}
          sendActivation={sendActivation}
          serverErrors={serverErrors}
          showFailed={showFailed}
          submitFunc={submitFunc}
          submitting={submitting}
          success={success}
          successMessage={successMessage}
        />
        <div className="bottom">
          <span
            className="back"
            onClick={() =>
              this.props.selectedUser ? openUrl("/users") : openUrl("/")
            }
          >
            Back
          </span>
          |
          <span className="home" onClick={() => openUrl("/")}>
            Home
          </span>
        </div>
      </div>
    );
  }
}

CreateUser.propTypes = {
  selectedUser: PropTypes.shape({
    admin: PropTypes.bool,
    archetypes: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string,
    institution: PropTypes.string,
    id: PropTypes.number,
    group: PropTypes.string,
  }),
};

export default CreateUser;
