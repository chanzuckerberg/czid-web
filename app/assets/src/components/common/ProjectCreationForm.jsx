import React from "react";
import Input from "~ui/controls/Input";
import RadioButton from "~ui/controls/RadioButton";
import PropTypes from "prop-types";
import cx from "classnames";
import { createProject } from "~/api";
import cs from "./project_creation_form.scss";

class ProjectCreationForm extends React.Component {
  state = {
    name: "",
    publicAccess: 1,
    error: ""
  };

  handleNameChange = name => {
    this.setState({
      name
    });
  };

  handleCreateProject = async () => {
    if (this.state.name === "") {
      return;
    }
    this.setState({
      error: ""
    });
    try {
      const newProject = await createProject({
        name: this.state.name,
        public_access: this.state.publicAccess
      });

      this.props.onCreate(newProject);
    } catch (e) {
      if (e === "Duplicate name") {
        this.setState({
          error: "Project name is already taken."
        });
      }
    }
  };

  render() {
    return (
      <div className={cs.projectCreationForm}>
        <div className={cs.field}>
          <div className={cs.label}>New Project Name</div>
          <Input
            fluid
            value={this.state.name}
            onChange={this.handleNameChange}
          />
        </div>
        <div className={cs.field}>
          <div className={cs.label}>Project Sharing</div>
          <div
            className={cs.sharingOption}
            onClick={() => this.setState({ publicAccess: 1 })}
          >
            <RadioButton
              selected={this.state.publicAccess === 1}
              className={cs.radioButton}
            />
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
              selected={this.state.publicAccess === 0}
              className={cs.radioButton}
            />
            <div className={cs.optionText}>
              <div className={cs.title}>Private Project</div>
              <div className={cs.description}>
                Only viewable by you and users you specify. Individual samples
                will become public after one year.
              </div>
            </div>
          </div>
        </div>
        {this.state.error && <div className={cs.error}>{this.state.error}</div>}
        <div className={cs.controls}>
          <div
            className={cx(
              cs.createButton,
              this.state.name === "" && cs.disabled
            )}
            onClick={this.handleCreateProject}
          >
            Create Project
          </div>
          <div className={cs.cancelButton} onClick={this.props.onCancel}>
            Cancel
          </div>
        </div>
      </div>
    );
  }
}

ProjectCreationForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

export default ProjectCreationForm;
