import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";

import BasicPopup from "~/components/BasicPopup";
import Input from "~ui/controls/Input";
import Textarea from "~ui/controls/Textarea";
import RadioButton from "~ui/controls/RadioButton";
import { createProject } from "~/api";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import { MAX_DESCRIPTION_LENGTH } from "~/components/views/projects/constants";
import { logAnalyticsEvent } from "~/api/analytics";

import cs from "./project_creation_form.scss";

class ProjectCreationForm extends React.Component {
  state = {
    name: "",
    publicAccess: -1, // No selection by default
    error: "",
    description: "",
    showInfo: false,
  };

  handleNameChange = name => {
    this.setState({
      name,
    });
  };

  handleDescriptionChange = description => {
    this.setState({
      description,
    });
  };

  handleCreateProject = async () => {
    if (this.state.name === "" || this.state.publicAccess === -1) {
      return;
    }
    this.setState({
      error: "",
    });
    try {
      const newProject = await createProject({
        name: this.state.name,
        public_access: this.state.publicAccess,
        description: this.state.description,
      });

      this.props.onCreate(newProject);
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
    const { showInfo, name, publicAccess, description, error } = this.state;

    let disableCreateButton = false;
    if (name === "" || publicAccess === -1 || description.length < 1) {
      disableCreateButton = true;
    }

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
            onClick={() => this.setState({ publicAccess: 1 })}
          >
            <RadioButton
              selected={publicAccess === 1}
              className={cs.radioButton}
            />
            <PublicProjectIcon className={cs.projectIcon} />
            <div className={cs.optionText}>
              <div className={cs.title}>Public Project</div>
              <div className={cs.description}>
                Viewable by all users of IDseq
              </div>
            </div>
          </div>
          <div
            className={cs.sharingOption}
            onClick={() => this.setState({ publicAccess: 0 })}
          >
            <RadioButton
              selected={publicAccess === 0}
              className={cs.radioButton}
            />
            <PrivateProjectIcon className={cs.projectIcon} />
            <div className={cs.optionText}>
              <div className={cs.title}>Private Project</div>
              <div className={cs.description}>
                Only viewable by you and users you specify. Individual samples
                will become public after one year.
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
                <span className={cs.title}>Example project description: </span>Investigation
                of pathogen diversity in healthy vs. diseased dogs in
                California. Sequenced RNA extracted from dog stool with a MiSeq.
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
                onClick={this.handleCreateProject}
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
