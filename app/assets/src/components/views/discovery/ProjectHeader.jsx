import cx from "classnames";
import { assign, find, min } from "lodash/fp";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { validateProjectName, saveProjectName } from "~/api";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
import EditableInput from "~/components/ui/controls/EditableInput";
import ProjectSettingsModal from "~/components/views/samples/ProjectSettingsModal";
import ProjectUploadMenu from "~/components/views/samples/ProjectUploadMenu";
import { IconMemberSmall, IconPrivateSmall, IconPublicSmall } from "~ui/icons";
import IconViewSmall from "~ui/icons/IconViewSmall";
import cs from "./project_header.scss";

const ProjectHeader = ({
  project,
  snapshotProjectName,
  fetchedSamples,
  onProjectUpdated,
  onMetadataUpdated,
  workflow,
}) => {
  const handleProjectUserAdded = (username, email) => {
    const userFound = find({ email }, project.users);
    if (!userFound) {
      const newProject = assign(project, {
        users: [...project.users, { name: username, email }],
      });
      onProjectUpdated && onProjectUpdated({ project: newProject });
    }
  };

  const handleProjectPublished = () => {
    const newProject = assign(project, {
      public_access: 1,
    });
    onProjectUpdated && onProjectUpdated({ project: newProject });
  };

  const currentTimestamp = moment();
  // TODO(tiago): fetched samples might not include all samples (legacy issue)
  const nextPublicSampleTimestamp = min(
    fetchedSamples
      .map(sample => moment(sample.privateUntil))
      .filter(timestamp => timestamp >= currentTimestamp),
  );
  const nextPublicSampleDate = nextPublicSampleTimestamp
    ? nextPublicSampleTimestamp.format("MMM Do, YYYY")
    : null;

  const handleProjectRename = async name => {
    if (name === project.name) return ["", name];

    const { valid, sanitizedName, message } = await validateProjectName(
      project.id,
      name,
    );
    if (!valid) return [message, name];

    let error = "";

    try {
      await saveProjectName(project.id, sanitizedName);
      onMetadataUpdated();
      trackEvent(ANALYTICS_EVENT_NAMES.PROJECT_HEADER_PROJECT_RENAMED, {
        projectId: project.id,
        projectName: sanitizedName,
      });
    } catch (e) {
      error = "There was an error renaming your project.";
    }
    return [error, sanitizedName];
  };

  const getWarningMessage = inputText => {
    const specialCharacters = /[^A-Za-z0-9_\- ]/g;
    if (specialCharacters.test(inputText)) {
      return 'The special character(s) you entered will be converted to "-"';
    } else {
      return "";
    }
  };

  return (
    <div className={cs.projectHeader}>
      {project.editable ? (
        <EditableInput
          value={project.name || snapshotProjectName}
          className={cs.name}
          onDoneEditing={handleProjectRename}
          getWarningMessage={getWarningMessage}
        />
      ) : (
        <div className={cs.name}>{project.name || snapshotProjectName}</div>
      )}
      <div className={cs.fillIn} />
      {snapshotProjectName ? (
        <div className={cs.item}>
          <IconViewSmall className={cs.smallIcon} /> View-only version
        </div>
      ) : project.public_access ? (
        <div className={cs.item}>
          <IconPublicSmall className={cs.smallIcon} /> Public project
        </div>
      ) : (
        <div className={cs.item}>
          <IconPrivateSmall className={cs.smallIcon} /> Private project
        </div>
      )}
      {project.editable && (
        <React.Fragment>
          <ProjectInfoIconTooltip
            isPublic={project.public_access === 1}
            position="bottom center"
          />
          <div className={cs.item}>
            <IconMemberSmall className={cx(cs.smallIcon, cs.userIcon)} />{" "}
            {project.users.length
              ? `${project.users.length} member${
                  project.users.length > 1 ? "s" : ""
                }`
              : "No members"}
          </div>
          <div className={cs.item}>
            <ProjectSettingsModal
              // TODO(tiago): remove csrf by restructuring api calls within ProjectSettingsModal
              csrf={document.getElementsByName("csrf-token")[0].content}
              nextPublicSampleDate={nextPublicSampleDate}
              onUserAdded={handleProjectUserAdded}
              onProjectPublished={handleProjectPublished}
              project={project}
              users={project.users}
            />
          </div>
        </React.Fragment>
      )}

      {project.editable && (
        <div className={cs.item}>
          <ProjectUploadMenu
            project={project}
            onMetadataUpdated={onMetadataUpdated}
            workflow={workflow}
          />
        </div>
      )}
    </div>
  );
};

ProjectHeader.propTypes = {
  fetchedSamples: PropTypes.array,
  onMetadataUpdated: PropTypes.func,
  onProjectUpdated: PropTypes.func,
  project: PropTypes.object.isRequired,
  snapshotProjectName: PropTypes.string,
  workflow: PropTypes.string,
};

export default ProjectHeader;
