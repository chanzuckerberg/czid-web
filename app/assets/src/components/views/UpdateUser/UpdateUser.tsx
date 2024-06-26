import { includes } from "lodash/fp";
import React, { useState } from "react";
import { updateUser as userUpdater } from "~/api/user";
import { openUrl } from "~utils/links";
import { UserForm } from "./components/UserForm";

const DPH = "DPH";
const GCE = "GCE";
const AFRICA_CDC = "Africa CDC";
const BIOHUB = "Biohub";
const LMIC = "LMIC";

const MEDICAL_DETECTIVE = "Medical Detective";
const LANDSCAPE_EXPLORER = "Landscape Explorer";
const OUTBREAK_SURVEYOR = "Outbreak Surveyor";
const MICROBIOME_INVESTIGATOR = "Microbiome Investigator";

interface UpdateUserProps {
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

function UpdateUser(props: UpdateUserProps = {}) {
  const user = props.selectedUser;
  const selectedUser = {
    email: user ? user.email : "",
    name: user ? user.name : "",
    institution: user ? user.institution : "",
    id: user ? user.id : null,
    adminStatus: user ? user.admin : null,
    archetypes: user ? user.archetypes : [],
    segments: user ? user.segments : null,
  };
  // submission state and error handling
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [serverErrors, setServerErrors] = useState([]);

  // user form state
  const [isAdmin, setIsAdmin] = useState(!!selectedUser.adminStatus);
  const [email, setEmail] = useState(selectedUser.email || "");
  const [name, setName] = useState(selectedUser.name || "");
  const [id] = useState(selectedUser.id);
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

  function isUpdateFormValid(): boolean {
    if (email === "") {
      setShowFailed(true);
      setErrorMessage("Please enter valid email address");
      return false;
    }

    return true;
  }

  const handleUpdate = () => {
    if (isUpdateFormValid()) {
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      archetypes.push(MEDICAL_DETECTIVE);
    }
    if (isLandscapeExplorer) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      archetypes.push(LANDSCAPE_EXPLORER);
    }
    if (isOutbreakSurveyor) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      archetypes.push(OUTBREAK_SURVEYOR);
    }
    if (isMicrobiomeInvestigator) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      archetypes.push(MICROBIOME_INVESTIGATOR);
    }
    return JSON.stringify(archetypes);
  };

  const getSegments = () => {
    const segments = [];
    if (isAfricaCDC) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      segments.push(AFRICA_CDC);
    }
    if (isBiohub) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      segments.push(BIOHUB);
    }
    if (isDPH) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      segments.push(DPH);
    }
    if (isGCE) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      segments.push(GCE);
    }
    if (isLMIC) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      segments.push(LMIC);
    }
    return JSON.stringify(segments);
  };

  async function updateUser() {
    const archetypes = getArchetypes();
    const segments = getSegments();
    try {
      await userUpdater({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
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
        onAdminChange={() => {
          setIsAdmin(prevState => !prevState);
        }}
        onAfricaCDCChange={() => setIsAfricaCDC(prevState => !prevState)}
        onBiohubChange={() => setIsBiohub(prevState => !prevState)}
        onDPHChange={() => setIsDPH(prevState => !prevState)}
        onEmailChange={handleEmailChange}
        onGCEChange={() => setIsGCE(prevState => !prevState)}
        onInstitutionChange={handleInstitutionChange}
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
        onNameChange={handleNameChange}
        onOutbreakSurveyorChange={() =>
          setIsOutbreakSurveyor(prevState => !prevState)
        }
        serverErrors={serverErrors}
        showFailed={showFailed}
        submitFunc={handleUpdate}
        submitting={submitting}
        success={success}
        successMessage={successMessage}
      />
      <div className="bottom">
        <a href={"/users"}>Back</a> |<a href="/">Home</a>
      </div>
    </div>
  );
}

export default UpdateUser;
