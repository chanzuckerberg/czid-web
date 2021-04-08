import React from "react";

import { openUrl } from "~utils/links";
import { withAnalytics } from "~/api/analytics";
import UserForm from "~/components/views/UserForm";
import { createUser, updateUser } from "~/api/user";

const GROUP_OPTIONS = [
  { text: "DPH", value: "DPH" },
  { text: "GCE", value: "GCE" },
  { text: "Africa CDC", value: "Africa CDC" },
  { text: "Biohub", value: "Biohub" },
  { text: "LMIC", value: "LMIC" },
  { text: "N/A", value: "" },
];

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
      adminstatus: this.selectedUser.adminStatus,
      id: this.selectedUser.id,
      sendActivation: true,
      institution: this.selectedUser.institution || "",
      isMedicalDetective: !!(
        this.selectedUser.archetypes &&
        this.selectedUser.archetypes.includes(MEDICAL_DETECTIVE)
      ),
      isLandscapeExplorer: !!(
        this.selectedUser.archetypes &&
        this.selectedUser.archetypes.includes(LANDSCAPE_EXPLORER)
      ),
      isOutbreakSurveyor: !!(
        this.selectedUser.archetypes &&
        this.selectedUser.archetypes.includes(OUTBREAK_SURVEYOR)
      ),
      isMicrobiomeInvestigator: !!(
        this.selectedUser.archetypes &&
        this.selectedUser.archetypes.includes(MICROBIOME_INVESTIGATOR)
      ),
      group: this.selectedUser.group,
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

  toggleCheckBox = e => {
    this.setState({
      isAdmin: e.target.value !== "true",
      adminstatus: e.target.value !== "true",
    });
  };

  handleEmailChange = e => {
    this.setState({
      email: e.target.value,
    });
  };

  handleNameChange = e => {
    this.setState({
      name: e.target.value,
    });
  };

  handleInstitutionChange = e => {
    this.setState({
      institution: e.target.value,
    });
  };

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

  onGroupChange = group => {
    this.setState({ group });
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
    const {
      name,
      email,
      institution,
      isAdmin,
      sendActivation,
      group,
    } = this.state;
    const archetypes = this.getArchetypes();
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
        serverErrors: err.response.data,
      });
    }
  };

  async updateUser() {
    const { name, email, institution, isAdmin, group, id } = this.state;
    const archetypes = this.getArchetypes();
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
        serverErrors: err.response.data,
      });
    }
  }

  render() {
    const { selectedUser } = this.props;
    const {
      email,
      errorMessage,
      group,
      institution,
      isAdmin,
      isLandscapeExplorer,
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
          group={group}
          groupOptions={GROUP_OPTIONS}
          institution={institution}
          isAdmin={isAdmin}
          name={name}
          onAdminChange={withAnalytics(
            this.toggleCheckBox,
            "CreateUser_admin_changed"
          )}
          onEmailChange={withAnalytics(
            this.handleEmailChange,
            "CreateUser_email_changed"
          )}
          onGroupChange={this.onGroupChange}
          onInstitutionChange={withAnalytics(
            this.handleInstitutionChange,
            "CreateUser_institution_changed"
          )}
          onLandscapeExplorerChange={() =>
            this.setState({ isLandscapeExplorer: !isLandscapeExplorer })
          }
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
export default CreateUser;
