import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { assign, find, min } from "lodash/fp";

import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";
import UserIcon from "~ui/icons/UserIcon";
import ProjectSettingsModal from "~/components/views/samples/ProjectSettingsModal";
import ProjectUploadMenu from "~/components/views/samples/ProjectUploadMenu";
import NextActionButton from "~/components/ui/controls/buttons/NextActionButton";
import { UserContext } from "~/components/common/UserContext";

import cs from "./project_header.scss";
import cx from "classnames";

const NCOV_PUBLIC_SITE = true;

class ProjectHeader extends React.Component {
  render() {
    const {
      project,
      onProjectUpdated,
      onMetadataUpdated,
      fetchedSamples,
    } = this.props;
    const { appConfig } = this.context || {};

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

    const VIEW_HEATMAP_LINK = `visualizations/heatmap/${
      appConfig.publicNcovHeatmapId
    }`;

    return (
      <div className={cs.projectHeader}>
        <div className={cs.name}>{project.name}</div>
        {NCOV_PUBLIC_SITE && (
          <div className={cs.description}>{project.description}</div>
        )}
        <div className={cs.fillIn} />
        {NCOV_PUBLIC_SITE && (
          <a href={VIEW_HEATMAP_LINK}>
            <NextActionButton label="View Heatmap" />
          </a>
        )}
        {!NCOV_PUBLIC_SITE && (
          <React.Fragment>
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
                <ProjectUploadMenu
                  project={project}
                  onMetadataUpdated={onMetadataUpdated}
                />
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    );
  }
}

ProjectHeader.propTypes = {
  fetchedSamples: PropTypes.array,
  onMetadataUpdated: PropTypes.func,
  onProjectUpdated: PropTypes.func,
  project: PropTypes.object.isRequired,
};

ProjectHeader.contextType = UserContext;

export default ProjectHeader;
