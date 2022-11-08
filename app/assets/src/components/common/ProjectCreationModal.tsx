import { Button, Icon, Tooltip } from "czifui";
import React, { useState, useEffect } from "react";

import { createProject } from "~/api";
import { trackEvent } from "~/api/analytics";
import List from "~/components/ui/List";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { MAX_DESCRIPTION_LENGTH } from "~/components/views/projects/constants";
import Modal from "~ui/containers/Modal";
import Input from "~ui/controls/Input";
import RadioButton from "~ui/controls/RadioButton";
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

  useEffect(() => {
    trackEvent("ProjectCreationModal_more-info-toggle_clicked", {
      showInfo,
    });
  }, [showInfo]);

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
      const receivedNameTakenError =
        e.data[0] === "Name has already been taken";
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
          <div
            className={cs.sharingOption}
            onClick={() => setAccessLevel(ACCESS_LEVEL.publicAccess)}
          >
            <div className={cs.radioButtonAndProjectIcon}>
              <RadioButton
                selected={accessLevel === ACCESS_LEVEL.publicAccess}
                className={cs.radioButton}
              />
              <div className={cs.projectIcon}>
                <Icon sdsIcon="projectPublic" sdsSize="xl" sdsType="static" />
              </div>
            </div>
            <div className={cs.optionText}>
              <div className={cs.title}>Public Project</div>
              <div className={cs.description}>
                This project is viewable and searchable by anyone in CZ ID.
                They’ll be able to perform actions like create heatmaps and
                download results. Public projects can’t be changed to Private.{" "}
                <ExternalLink href="https://help.czid.org">
                  Learn more
                </ExternalLink>
              </div>
            </div>
          </div>
          <div
            className={cs.sharingOption}
            onClick={() => setAccessLevel(ACCESS_LEVEL.privateAccess)}
          >
            <div className={cs.radioButtonAndProjectIcon}>
              <RadioButton
                selected={accessLevel === ACCESS_LEVEL.privateAccess}
                className={cs.radioButton}
              />
              <div className={cs.projectIcon}>
                <Icon sdsIcon="projectPrivate" sdsSize="xl" sdsType="static" />
              </div>
            </div>
            <div className={cs.optionText}>
              <div className={cs.title}>Private Project</div>
              <div className={cs.description}>
                Samples added to this project will be private by default,
                visible only to you and other project members. Private samples
                will become public 1 year after their upload date. You can
                change a Private project to Public at any time.{" "}
                <ExternalLink href="https://help.czid.org">
                  Learn more
                </ExternalLink>
              </div>
            </div>
          </div>
        </div>
        <div className={cs.field}>
          <div className={cs.label}>
            Project Description{" "}
            <span
              className={cs.infoLink}
              onClick={() => setShowInfo(!showInfo)}
            >
              {showInfo ? "Less Info" : "More Info"}
            </span>
          </div>
          {showInfo && (
            <div className={cs.info}>
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
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectCreationModal;
