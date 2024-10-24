import { Button, Icon, InputRadio, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import React, { useEffect, useState } from "react";
import { createProject } from "~/api";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import List from "~/components/ui/List";
import { PROJECT_SHARING_HELP_LINK } from "~/components/utils/documentationLinks";
import { MAX_DESCRIPTION_LENGTH } from "~/components/views/DiscoveryView/components/ProjectsView/constants";
import Modal from "~ui/containers/Modal";
import Input from "~ui/controls/Input";
import Textarea from "~ui/controls/Textarea";
import cs from "./project_creation_modal.scss";

const ACCESS_LEVEL = Object.freeze({
  publicAccess: 1,
  privateAccess: 0,
  noSelection: -1,
});

interface ProjectCreationModalProps {
  modalOpen: boolean;
  onCancel: $TSFixMeFunction;
  onCreate: $TSFixMeFunction;
}

const ProjectCreationModal = ({
  modalOpen,
  onCancel,
  onCreate,
}: ProjectCreationModalProps) => {
  const [name, setName] = useState("");
  const [accessLevel, setAccessLevel] = useState<number>(
    ACCESS_LEVEL.noSelection,
  ); // No selection by default
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [disableCreateButton, setDisableCreateButton] = useState(true);

  useEffect(() => {
    const anyFieldInvalid =
      name === "" ||
      accessLevel === ACCESS_LEVEL.noSelection ||
      description.length < 1;

    setDisableCreateButton(anyFieldInvalid);
  }, [name, accessLevel, description]);

  // this is broken, but alldoami found it while working on something unrelated
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [showInfo]);

  const handleCreateProject = async () => {
    setError("");
    setCreatingProject(true);

    try {
      const newProject = await createProject({
        name: name,
        public_access: accessLevel,
        description: description,
      });

      onCreate(newProject);
    } catch (e) {
      const receivedNameTakenError = e[0] === "Name has already been taken";
      const errorMsg = receivedNameTakenError
        ? "This project name is already taken. Please enter another name."
        : "There was an error creating your project.";
      setError(errorMsg);
    } finally {
      setCreatingProject(false);
    }
  };

  const getCreateProjectButton = () => {
    const renderCreateButton = () => (
      <Button
        disabled={disableCreateButton || creatingProject}
        sdsStyle="rounded"
        sdsType="primary"
        onClick={handleCreateProject}
        data-testid="create-project-btn"
      >
        Create Project
      </Button>
    );

    return disableCreateButton ? (
      <Tooltip arrow placement="top" title="Fill in all fields to continue.">
        <span>{renderCreateButton()}</span>
      </Tooltip>
    ) : (
      <>{renderCreateButton()}</>
    );
  };

  return (
    <Modal tall open={modalOpen} onClose={onCancel} xlCloseIcon>
      <div className={cs.projectCreationModal}>
        <div className={cs.modalTitle}>New Project</div>
        <div className={cs.field}>
          <div className={cs.label}>Project Name</div>
          <Input fluid value={name} onChange={setName} />
        </div>
        <div className={cs.field}>
          <div className={cs.label}>Project Sharing</div>
          <button
            className={cx(cs.sharingOption, "noStyleButton")}
            onClick={() => setAccessLevel(ACCESS_LEVEL.publicAccess)}
            data-testid="public-project"
          >
            <div className={cs.radioButtonAndProjectIcon}>
              <InputRadio
                className={cs.radioButton}
                stage={
                  accessLevel === ACCESS_LEVEL.publicAccess
                    ? "checked"
                    : "unchecked"
                }
              />
              <div className={cs.projectIcon}>
                <Icon sdsIcon="projectPublic" sdsSize="xl" sdsType="static" />
              </div>
            </div>
            <div className={cs.optionText}>
              <div className={cs.title}>Public Project</div>
              <div className={cs.description}>
                This project is viewable and searchable by anyone in CZ ID.
                They’ll be able to perform read-only actions like create
                heatmaps and download results, but will not have access to your
                raw data.{" "}
                <ExternalLink href={PROJECT_SHARING_HELP_LINK}>
                  Learn more
                </ExternalLink>
              </div>
            </div>
          </button>
          <button
            className={cx(cs.sharingOption, "noStyleButton")}
            onClick={() => setAccessLevel(ACCESS_LEVEL.privateAccess)}
            data-testid="private-project"
          >
            <div className={cs.radioButtonAndProjectIcon}>
              <InputRadio
                className={cs.radioButton}
                stage={
                  accessLevel === ACCESS_LEVEL.privateAccess
                    ? "checked"
                    : "unchecked"
                }
              />
              <div className={cs.projectIcon}>
                <Icon sdsIcon="projectPrivate" sdsSize="xl" sdsType="static" />
              </div>
            </div>
            <div className={cs.optionText}>
              <div className={cs.title}>Private Project</div>
              <div className={cs.description}>
                Samples added to this project will be private by default,
                visible only to you and other project members. You choose if,
                and when, to share your samples with others either by adding
                them as members of your project or by changing your project from
                Private to Public.{" "}
                <ExternalLink href={PROJECT_SHARING_HELP_LINK}>
                  Learn more
                </ExternalLink>
              </div>
            </div>
          </button>
        </div>
        <div className={cs.field}>
          <div className={cs.label}>
            Project Description{" "}
            <button
              className={cx(cs.infoLink, "noStyleButton")}
              onClick={() => setShowInfo(!showInfo)}
              data-testid="more-less-info-btn"
            >
              {showInfo ? "Less Info" : "More Info"}
            </button>
          </div>
          {showInfo && (
            <div className={cs.info} data-testid="project-description-info">
              <div className={cs.title}>A project description may include:</div>
              <List
                listItems={[
                  `The project goal (benchmarking, identifying an unknown
                    pathogen, microbiome, etc.)`,
                  `If this work is part of a larger study, the aim of that study`,
                  `A summary of where the samples came from (geographically and
                  collection date) and preparation techniques, if relevant`,
                  `Any other context that might be helpful in interpreting the
                  data`,
                ]}
              />
              <p>
                <span className={cs.title}>Example project description: </span>
                Investigation of pathogen diversity in healthy vs. diseased dogs
                in California. Sequenced RNA extracted from dog stool with a
                MiSeq.
              </p>
            </div>
          )}
          <Textarea
            onChange={setDescription}
            value={description}
            className={cs.descriptionTextArea}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="Enter your project goals, information about your study, where your samples came from, etc..."
            data-testid="project-description"
          />
          <div className={cs.charCounter}>
            {MAX_DESCRIPTION_LENGTH - description.length}/
            {MAX_DESCRIPTION_LENGTH} characters remaining
          </div>
        </div>
        {error && <div className={cs.error}>{error}</div>}
        <div className={cs.controls}>
          {getCreateProjectButton()}
          <Button
            className={cs.cancelButton}
            sdsStyle="rounded"
            sdsType="secondary"
            onClick={onCancel}
            data-testid="cancel-btn"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectCreationModal;
