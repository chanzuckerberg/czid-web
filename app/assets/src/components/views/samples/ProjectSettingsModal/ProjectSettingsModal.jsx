import React from "react";
import cx from "classnames";
import PropTypes from "prop-types";
import axios from "axios";

import { withAnalytics } from "~/api/analytics";
import Modal from "~ui/containers/Modal";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import ShareButton from "~ui/controls/buttons/ShareButton";
import PublicProjectIcon from "~ui/icons/PublicProjectIcon";
import PrivateProjectIcon from "~ui/icons/PrivateProjectIcon";
import { UserContext } from "~/components/common/UserContext";
import Divider from "~/components/layout/Divider";

import UserManagementForm from "./UserManagementForm";
import PublicProjectConfirmationModal from "./PublicProjectConfirmationModal";
import ViewOnlySharingForm from "./ViewOnlySharingForm";
import cs from "./project_settings_modal.scss";

class ProjectSettingsModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalOpen: false,
    };
  }

  openModal = () => this.setState({ modalOpen: true });
  closeModal = () => this.setState({ modalOpen: false });

  makeProjectPublic = () => {
    const { csrf, onProjectPublished, project } = this.props;

    axios
      .put(`/projects/${project.id}.json`, {
        public_access: true,
        authenticity_token: csrf,
      })
      .then(() => {
        onProjectPublished();
      });
  };

  render() {
    const {
      csrf,
      nextPublicSampleDate,
      onUserAdded,
      project,
      users,
    } = this.props;
    const { allowedFeatures = [] } = this.context || {};

    return (
      <div>
        <ShareButton
          className={cs.projectSettingsTrigger}
          onClick={withAnalytics(
            this.openModal,
            "ProjectSettingsModal_open-link_click",
            {
              projectId: project.id,
              projectName: project.name,
            }
          )}
        />
        {this.state.modalOpen && (
          <Modal
            open
            narrow
            onClose={withAnalytics(
              this.closeModal,
              "ProjectSettingsModal_close-modal_clicked",
              {
                projectId: project.id,
                projectName: project.name,
              }
            )}
            className={cs.projectSettingsModal}
          >
            <div className={cs.projectSettingsContent}>
              <div className={cs.title}>
                Share <span className={cs.highlight}>{project.name}</span>
              </div>
              <div className={cx(cs.background, cs.projectVisibility)}>
                {project.public_access ? (
                  <div className={cs.visibility}>
                    <PublicProjectIcon className={cs.icon} />
                    <div className={cs.text}>
                      <div className={cs.label}>Public Project</div>
                      <div className={cs.note}>
                        This project is viewable and searchable to anyone in
                        IDseq, and they’ll be able to perform actions like
                        create heatmaps and download.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={cs.visibility}>
                    <PrivateProjectIcon className={cs.icon} />
                    <div className={cs.text}>
                      <div className={cs.header}>
                        <div className={cs.label}>Private Project</div>
                        <div className={cs.toggle}>
                          <PublicProjectConfirmationModal
                            onConfirm={withAnalytics(
                              this.makeProjectPublic,
                              "ProjectSettingsModal_public-button_confirmed",
                              {
                                projectId: project.id,
                                projectName: project.name,
                              }
                            )}
                            project={project}
                            trigger={
                              <ColumnHeaderTooltip
                                trigger={<span>Change to public</span>}
                                content="Changing this project to Public will allow anyone signed into IDseq to view and use your samples."
                              />
                            }
                          />
                        </div>
                      </div>
                      <div className={cs.note}>
                        {nextPublicSampleDate && (
                          <span>
                            {" "}
                            Next project sample will become public on{" "}
                            {nextPublicSampleDate}.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Divider style="thin" />
              <div className={cs.formContainer}>
                <UserManagementForm
                  csrf={csrf}
                  onUserAdded={onUserAdded}
                  project={project}
                  users={users}
                />
              </div>
              {allowedFeatures.includes("edit_snapshot_links") && (
                <div>
                  <Divider />
                  <div className={cs.formContainer}>
                    <ViewOnlySharingForm project={project} />
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }
}

ProjectSettingsModal.propTypes = {
  csrf: PropTypes.string.isRequired,
  onUserAdded: PropTypes.func,
  onProjectPublished: PropTypes.func,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    public_access: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  }).isRequired,
  nextPublicSampleDate: PropTypes.string,
  users: PropTypes.array,
};

ProjectSettingsModal.contextType = UserContext;

export default ProjectSettingsModal;
