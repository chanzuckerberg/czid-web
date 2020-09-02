import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import Input from "~ui/controls/Input";
import Textarea from "~ui/controls/Textarea";
import RadioButton from "~ui/controls/RadioButton";
import { createProject } from "~/api";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import { MAX_DESCRIPTION_LENGTH } from "~/components/views/projects/constants";
import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./project_creation_form.scss";

const ACCESS_LEVEL = Object.freeze({
  publicAccess: 1,
  privateAccess: 0,
  noSelection: -1,
});

class ProjectCreationForm extends React.Component {
  state = {
    name: "",
    accessLevel: ACCESS_LEVEL.noSelection, // No selection by default
    error: "",
    description: "",
    showInfo: false,
    disableCreateButton: true,
  };

  areCreationReqsMet(changed = {}) {
    const reqs = {
      name: this.state.name,
      accessLevel: this.state.accessLevel,
      description: this.state.description,
    };

    Object.keys(changed).forEach(requirement => {
      reqs[requirement] = changed[requirement];
    });

    if (
      reqs.name === "" ||
      reqs.accessLevel === ACCESS_LEVEL.noSelection ||
      reqs.description.length < 1
    ) {
      return false;
    }

    return true;
  }

  handleNameChange = name => {
    const disableCreateButton = !this.areCreationReqsMet({ name });
    this.setState({
      name,
      disableCreateButton,
    });
  };

  handleAccessLevelChange = accessLevel => {
    const disableCreateButton = !this.areCreationReqsMet({ accessLevel });
    this.setState({
      accessLevel,
      disableCreateButton,
    });
  };

  handleDescriptionChange = description => {
    const disableCreateButton = !this.areCreationReqsMet({ description });
    this.setState({
      description,
      disableCreateButton,
    });
  };

  handleCreateProject = async () => {
    const { onCreate } = this.props;
    const { name, accessLevel, description } = this.state;

    this.setState({
      error: "",
    });
    try {
      const newProject = await createProject({
        name: name,
        public_access: accessLevel,
        description: description,
      });

      onCreate(newProject);
    } catch (e) {
      if (e[0] === "Name has already been taken") {
        this.setState({
          error: "Project name is already taken.",
        });
      } else {
        this.setState({
          error: "There was an error creating your project.",
        });
      }
    }
  };

  toggleInfo = () => {
    const { showInfo } = this.state;

    this.setState(
      {
        showInfo: !showInfo,
      },
      () => {
        logAnalyticsEvent("ProjectCreationForm_more-info-toggle_clicked", {
          showInfo: this.state.showInfo,
        });
      }
    );
  };

  render() {
    const { onCancel } = this.props;
    const {
      showInfo,
      name,
      accessLevel,
      description,
      error,
      disableCreateButton,
    } = this.state;

    return (
      <div className={cs.projectCreationForm}>
        <div className={cs.field}>
          <div className={cs.label}>New Project Name</div>
          <Input fluid value={name} onChange={this.handleNameChange} />
        </div>
        <div className={cs.field}>
          <div className={cs.label}>Project Sharing</div>
          <div
            className={cs.sharingOption}
            onClick={() =>
              this.handleAccessLevelChange(ACCESS_LEVEL.publicAccess)
            }
          >
            <div className={cs.radioButtonAndProjectIcon}>
              <RadioButton
                selected={accessLevel === ACCESS_LEVEL.publicAccess}
                className={cs.radioButton}
              />
              <PublicProjectIcon className={cs.projectIcon} />
            </div>
            <div className={cs.optionText}>
              <div className={cs.title}>Public Project</div>
              <div className={cs.description}>
                This project is viewable and searchable by anyone in IDseq.
                They’ll be able to perform actions like create heatmaps and
                download results. Public projects can’t be changed to Private.
                <ExternalLink href="https://help.idseq.net">
                  {" "}
                  Learn more.
                </ExternalLink>
              </div>
            </div>
          </div>
          <div
            className={cs.sharingOption}
            onClick={() =>
              this.handleAccessLevelChange(ACCESS_LEVEL.privateAccess)
            }
          >
            <div className={cs.radioButtonAndProjectIcon}>
              <RadioButton
                selected={accessLevel === ACCESS_LEVEL.privateAccess}
                className={cs.radioButton}
              />
              <PrivateProjectIcon className={cs.projectIcon} />
            </div>
            <div className={cs.optionText}>
              <div className={cs.title}>Private Project</div>
              <div className={cs.description}>
                Samples added to this project will be private by default,
                visible only to you and other project members. Private samples
                will become public 1 year after their upload date. You can
                change a Private project to Public at any time.
                <ExternalLink href="https://help.idseq.net">
                  {" "}
                  Learn more.
                </ExternalLink>
              </div>
            </div>
          </div>
        </div>
        <div className={cs.field}>
          <div className={cs.label}>
            Project Description{" "}
            <span className={cs.infoLink} onClick={this.toggleInfo}>
              {showInfo ? "Less Info" : "More Info"}
            </span>
          </div>
          {showInfo && (
            <div className={cs.info}>
              <div className={cs.title}>A project description may include:</div>
              <ul>
                <li>
                  The project goal (benchmarking, identifying an unknown
                  pathogen, microbiome, etc.)
                </li>
                <li>
                  If this work is part of a larger study, the aim of that study
                </li>
                <li>
                  A summary of where the samples came from (geographically and
                  collection date) and preparation techniques, if relevant
                </li>
                <li>
                  Any other context that might be helpful in interpreting the
                  data
                </li>
              </ul>
              <p>
                <span className={cs.title}>Example project description: </span>
                Investigation of pathogen diversity in healthy vs. diseased dogs
                in California. Sequenced RNA extracted from dog stool with a
                MiSeq.
              </p>
            </div>
          )}
          <Textarea
            onChange={this.handleDescriptionChange}
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
          <BasicPopup
            trigger={
              <div
                className={cx(
                  cs.createButton,
                  disableCreateButton && cs.disabled
                )}
                onClick={
                  disableCreateButton ? () => {} : this.handleCreateProject
                }
              >
                Create Project
              </div>
            }
            disabled={!disableCreateButton} // enable the popup when create button is disabled and vice versa
            inverted={false}
            position="top center"
            basic={false}
            style={{ maxWidth: "175px" }}
          >
            Please complete all fields to create a project.
          </BasicPopup>
          <div className={cs.cancelButton} onClick={onCancel}>
            Cancel
          </div>
        </div>
      </div>
    );
  }
}

ProjectCreationForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default ProjectCreationForm;
