import cx from "classnames";
import { assign, find, min } from "lodash/fp";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import ProjectInfoIconTooltip from "~/components/common/ProjectInfoIconTooltip";
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
      .filter(timestamp => timestamp >= currentTimestamp)
  );
  const nextPublicSampleDate = nextPublicSampleTimestamp
    ? nextPublicSampleTimestamp.format("MMM Do, YYYY")
    : null;

  return (
    <div className={cs.projectHeader}>
      <div className={cs.name}>{project.name || snapshotProjectName}</div>
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
};

export default ProjectHeader;
