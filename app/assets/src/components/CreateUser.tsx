import { includes } from "lodash/fp";
import React, { useState } from "react";
import { withAnalytics } from "~/api/analytics";
import { useCreateUser, updateUser as userUpdater } from "~/api/user";
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

interface CreateUserProps {
  selectedUser?: {
    admin?: boolean;
    archetypes?: string;
    email?: string;
    name?: string;
    institution?: string;
    id?: number;
    segments?: string;
  };
}

function CreateUser(props: CreateUserProps = {}) {
  const user = props.selectedUser || null;
  const selectedUser = {
    email: user ? user.email : "",
    name: user ? user.name : "",
    institution: user ? user.institution : "",
    id: user ? user.id : null,
    adminStatus: user ? user.admin : null,
    archetypes: user ? user.archetypes : [],
    segments: user ? user.segments : null,
  };
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(!!selectedUser.adminStatus);
  const [success, setSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [serverErrors, setServerErrors] = useState([]);
  const [email, setEmail] = useState(selectedUser.email || "");
  const [name, setName] = useState(selectedUser.name || "");
  const [id] = useState(selectedUser.id);
  const [sendActivation, setSendActivation] = useState(true);
  const [institution, setInstitution] = useState(
    selectedUser.institution || "",
  );
  const [isMedicalDetective, setIsMedicalDetective] = useState(
    includes(MEDICAL_DETECTIVE, selectedUser.archetypes),
  );
  const [isLandscapeExplorer, setIsLandscapeExplorer] = useState(
    includes(LANDSCAPE_EXPLORER, selectedUser.archetypes),
  );
  const [isOutbreakSurveyor, setIsOutbreakSurveyor] = useState(
    includes(OUTBREAK_SURVEYOR, selectedUser.archetypes),
  );
  const [isMicrobiomeInvestigator, setIsMicrobiomeInvestigator] = useState(
    includes(MICROBIOME_INVESTIGATOR, selectedUser.archetypes),
  );
  const [isAfricaCDC, setIsAfricaCDC] = useState(
    includes(AFRICA_CDC, selectedUser.segments),
  );
  const [isBiohub, setIsBiohub] = useState(
    includes(BIOHUB, selectedUser.segments),
  );
  const [isDPH, setIsDPH] = useState(includes(DPH, selectedUser.segments));
  const [isGCE, setIsGCE] = useState(includes(GCE, selectedUser.segments));
  const [isLMIC, setIsLMIC] = useState(includes(LMIC, selectedUser.segments));

  const userCreator = useCreateUser();

  const isCreateFormInvalid = () => {
    if (email === "") {
      setShowFailed(true);
      setErrorMessage("Please fill all fields");
      return true;
    }
  };

  function isUpdateFormValid() {
    if (email === "") {
      setShowFailed(true);
      setErrorMessage("Please enter valid email address");
      return true;
    }
  }

  const handleCreate = () => {
    if (!isCreateFormInvalid()) {
      setSubmitting(true);
      createUser();
    }
  };

  const handleUpdate = () => {
    if (!isUpdateFormValid()) {
      setSubmitting(true);
      updateUser();
    }
  };

  const clearError = () => {
    setShowFailed(false);
  };

  const handleEmailChange = (email: string) => setEmail(email);

  const handleNameChange = (name: string) => setName(name);

  const handleInstitutionChange = (institution: string) =>
    setInstitution(institution);

  const getArchetypes = () => {
    const archetypes = [];
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

  const getSegments = () => {
    const segments = [];
    if (isAfricaCDC) {
      segments.push(AFRICA_CDC);
    }
    if (isBiohub) {
      segments.push(BIOHUB);
    }
    if (isDPH) {
      segments.push(DPH);
    }
    if (isGCE) {
      segments.push(GCE);
    }
    if (isLMIC) {
      segments.push(LMIC);
    }
    return JSON.stringify(segments);
  };

  const createUser = async () => {
    const archetypes = getArchetypes();
    const segments = getSegments();
    try {
      // @ts-expect-error This expression is not callable.
      await userCreator({
        variables: {
          name,
          email,
          institution,
          role: isAdmin ? 1 : 0,
          sendActivation,
          archetypes,
          segments,
        },
      });

      setSubmitting(false);
      setSuccess(true);
      setSuccessMessage("User created successfully");
      openUrl("/users");
    } catch (err) {
      setSubmitting(false);
      setShowFailed(true);
      // create user graphQL endpoint returns a single error string instead of array of errors
      // but there are other contexts where the UserForm still expects an array
      setServerErrors([err.message]);
    }
  };

  async function updateUser() {
    const archetypes = getArchetypes();
    const segments = getSegments();
    try {
      await userUpdater({
        userId: id,
        name,
        email,
        institution,
        isAdmin,
        archetypes,
        segments,
      });
      setSubmitting(false);
      setSuccess(true);
      setSuccessMessage("User updated successfully");
      openUrl("/users");
    } catch (err) {
      setSubmitting(true);
      setSuccess(false);
      setServerErrors(err.data);
    }
  }

  const submitFunc = props.selectedUser
    ? () =>
        withAnalytics(handleUpdate, "CreateUser_update-form_submitted", {
          form: "Update",
        })
    : () =>
        withAnalytics(handleCreate, "CreateUser_create-form_submitted", {
          form: "Create",
        });
  const funcName = props.selectedUser ? "Update" : "Create";

  return (
    <div>
      <UserForm
        archetypes={{
          isMedicalDetective,
          isLandscapeExplorer,
          isOutbreakSurveyor,
          isMicrobiomeInvestigator,
        }}
        clearError={clearError}
        email={email}
        errorMessage={errorMessage}
        funcName={funcName}
        segments={{
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
          setIsAdmin(prevState => !prevState);
        }, "CreateUser_admin_changed")}
        onAfricaCDCChange={() => setIsAfricaCDC(prevState => !prevState)}
        onBiohubChange={() => setIsBiohub(prevState => !prevState)}
        onDPHChange={() => setIsDPH(prevState => !prevState)}
        onEmailChange={withAnalytics(
          handleEmailChange,
          "CreateUser_email_changed",
        )}
        onGCEChange={() => setIsGCE(prevState => !prevState)}
        onInstitutionChange={withAnalytics(
          handleInstitutionChange,
          "CreateUser_institution_changed",
        )}
        onLandscapeExplorerChange={() =>
          setIsLandscapeExplorer(prevState => !prevState)
        }
        onLMICChange={() => setIsLMIC(prevState => !prevState)}
        onMedicalDetectiveChange={() =>
          setIsMedicalDetective(prevState => !prevState)
        }
        onMicrobiomeInvestigatorChange={() =>
          setIsMicrobiomeInvestigator(prevState => !prevState)
        }
        onNameChange={withAnalytics(
          handleNameChange,
          "CreateUser_name_changed",
        )}
        onOutbreakSurveyorChange={() =>
          setIsOutbreakSurveyor(prevState => !prevState)
        }
        onSendActivationChange={withAnalytics(() => {
          setSendActivation(prevState => !prevState);
        }, "CreateUser_send-activation_changed")}
        selectedUser={props.selectedUser}
        sendActivation={sendActivation}
        serverErrors={serverErrors}
        showFailed={showFailed}
        submitFunc={submitFunc}
        submitting={submitting}
        success={success}
        successMessage={successMessage}
      />
      <div className="bottom">
        <a href={props.selectedUser ? "/users" : "/"}>Back</a> |
        <a href="/">Home</a>
      </div>
    </div>
  );
}

export default CreateUser;
