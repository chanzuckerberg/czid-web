import cx from "classnames";

import React from "react";

import { saveProjectDescription } from "~/api";
import MetadataSection from "~/components/common/DetailsSidebar/SampleDetailsMode/MetadataSection";
import { MAX_DESCRIPTION_LENGTH } from "~/components/views/projects/constants";
import { Optional, Project } from "~/interface/shared";
import Textarea from "~ui/controls/Textarea";
import cs from "./project_description.scss";

interface ProjectDescriptionProps {
  project: Optional<Project, "id">;
  onProjectDescriptionSave?: (value: string) => void;
}

interface ProjectDescriptionState {
  description: string;
  lastValidDescription: string;
  showLess: boolean;
  editing: boolean;
  changed: boolean;
  savePending: boolean;
  errors: boolean;
}

class ProjectDescription extends React.Component<
  ProjectDescriptionProps,
  ProjectDescriptionState
> {
  constructor(props: ProjectDescriptionProps) {
    super(props);

    this.toggleDisplayDescription = this.toggleDisplayDescription.bind(this);
    this.toggleEditing = this.toggleEditing.bind(this);

    this.state = {
      description: props.project.description ? props.project.description : "",
      lastValidDescription: props.project.description
        ? props.project.description
        : "",
      showLess: true,
      editing: false,
      changed: false,
      savePending: false,
      errors: null,
    };
  }

  toggleDisplayDescription() {
    this.setState(prevState => ({ showLess: !prevState.showLess }));
  }

  toggleEditing() {
    this.setState(prevState => ({ editing: !prevState.editing }));
  }

  handleDescriptionChange = value => {
    this.setState({
      description: value,
      changed: true,
      errors: null,
    });
  };

  handleDescriptionSave = async () => {
    const { changed } = this.state;
    const { onProjectDescriptionSave } = this.props;
    if (changed) {
      this.setState(
        {
          changed: false,
        },
        () => {
          this._save(this.props.project.id, this.state.description);
          onProjectDescriptionSave(this.state.description);
        },
      );
    }
  };

  _save = async (projectId, value) => {
    this.setState({
      savePending: true,
    });

    const lastValidDescription = this.state.lastValidDescription;

    const response = await saveProjectDescription(projectId, value);

    // If save fails, revert to last valid description value.
    if (response.status === "failed") {
      this.setState({
        description: lastValidDescription,
        errors: response.message,
      });
    } else {
      this.setState({
        description: value,
        lastValidDescription: value,
      });
    }

    this.setState({
      savePending: false,
    });
  };

  render() {
    const { description, showLess, errors } = this.state;
    const cutoffLength = MAX_DESCRIPTION_LENGTH / 2;
    const shouldTruncateDescription = description
      ? description.length > cutoffLength
      : false;

    return (
      <MetadataSection
        editable={this.props.project.editable}
        onEditToggle={this.toggleEditing}
        editing={this.state.editing}
        title="Description"
        savePending={this.state.savePending}
        alwaysShowEditLink={this.props.project.editable}
        open={true}
        toggleable={true}
      >
        {this.state.editing ? (
          <div className={cs.descriptionContainer}>
            <Textarea
              onChange={val => this.handleDescriptionChange(val)}
              onBlur={this.handleDescriptionSave}
              value={description}
              className={cs.textarea}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <div className={cs.charCounter}>
              {MAX_DESCRIPTION_LENGTH - description.length}/
              {MAX_DESCRIPTION_LENGTH} characters remaining
            </div>
            {errors && <div className={cs.error}>{errors}</div>}
          </div>
        ) : (
          <div className={cs.descriptionContainer}>
            {description ? (
              <div>
                <div
                  className={cx(
                    shouldTruncateDescription && showLess && cs.truncated,
                  )}
                >
                  {description}
                </div>
                {shouldTruncateDescription && (
                  <div
                    className={cs.showHide}
                    onClick={this.toggleDisplayDescription}
                  >
                    {showLess ? "Show More" : "Show Less"}
                  </div>
                )}
              </div>
            ) : (
              <div>No description.</div>
            )}
          </div>
        )}
      </MetadataSection>
    );
  }
}

export default ProjectDescription;
