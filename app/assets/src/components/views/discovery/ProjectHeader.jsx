import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { assign, find, min } from "lodash/fp";
import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";
import UserIcon from "~ui/icons/UserIcon";
import ProjectSettingsModal from "~/components/views/samples/ProjectSettingsModal";
import ProjectUploadMenu from "~/components/views/samples/ProjectUploadMenu";
import cs from "./project_header.scss";
import cx from "classnames";

const ProjectHeader = ({ project, fetchedSamples, onProjectUserAdded }) => {
  console.log("ProjectHeader:render - ", project);

  const handleProjectUserAdded = (username, email) => {
    const userFound = find({ email }, project.users);
    if (!userFound) {
      const newProject = assign(project, {
        users: [...project.users, { name: username, email }]
      });
      onProjectUpdate && onProjectUpdate(newProject);
    }
  };

  const handleProjectPublished = () => {
    const newProject = assign(project, {
      public: true
    });
    onProjectUpdate && onProjectUpdate(newProject);
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
      <div className={cs.name}>{project.name}</div>
      <div className={cs.fillIn} />
      {project.public_access ? (
        <div className={cs.item}>
          <GlobeIcon className={cs.smallIcon} /> Public project
        </div>
      ) : (
        <div className={cs.item}>
          <LockIcon className={cs.smallIcon} /> Private project
        </div>
      )}
      {project.editable && (
        <div className={cs.item}>
          <UserIcon className={cx(cs.smallIcon, cs.userIcon)} />{" "}
          {project.users.length
            ? `${project.users.length} member${
                project.users.length > 1 ? "s" : ""
              }`
            : "No members"}
        </div>
      )}
      {project.editable && (
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
      )}

      {project.editable && (
        <div className={cs.item}>
          <ProjectUploadMenu project={project} />
        </div>
      )}
    </div>
  );
};

ProjectHeader.propTypes = {
  fetchedSamples: PropTypes.array,
  project: PropTypes.object.isRequired,
  onProjectUpdated: PropTypes.func
};

export default ProjectHeader;
