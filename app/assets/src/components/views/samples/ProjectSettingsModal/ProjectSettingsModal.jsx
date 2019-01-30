import React from "react";
import PropTypes from "prop-types";
import Modal from "~ui/containers/Modal";
import GlobeIcon from "~ui/icons/GlobeIcon";
import LockIcon from "~ui/icons/LockIcon";
import Divider from "~/components/layout/Divider";
import UserManagementForm from "./UserManagementForm";
import PublicProjectConfirmationModal from "./PublicProjectConfirmationModal";
import cs from "./project_settings_modal.scss";
import axios from "axios";

class ProjectSettingsModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalOpen: false
    };
  }

  openModal = () => this.setState({ modalOpen: true });
  closeModal = () => this.setState({ modalOpen: false });

  makeProjectPublic = () => {
    const { csrf, onProjectPublished, project } = this.props;

    axios
      .put(`/projects/${project.id}.json`, {
        public_access: true,
        authenticity_token: csrf
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
      users
    } = this.props;

    return (
      <div>
        <div className={cs.projectSettingsTrigger} onClick={this.openModal}>
          Settings
        </div>
        {this.state.modalOpen && (
          <Modal
            open
            narrow
            onClose={this.closeModal}
            className={cs.projectSettingsModal}
          >
            <div className={cs.projectSettingsContent}>
              <div className={cs.title}>
                <span className={cs.highlight}>{project.name}</span> members and
                access control
              </div>
              <div className={cs.projectVisibility}>
                {project.public_access ? (
                  <div className={cs.visibility}>
                    <GlobeIcon className={cs.icon} />
                    <span className={cs.label}>Public Project</span>
                  </div>
                ) : (
                  <div className={cs.visibility}>
                    <LockIcon className={cs.icon} />
                    <span className={cs.label}>Private Project</span>
                    <span className={cs.toggle}>
                      <PublicProjectConfirmationModal
                        onConfirm={this.makeProjectPublic}
                        project={project}
                        trigger={<div>Make public</div>}
                      />
                    </span>
                  </div>
                )}
                <div className={cs.note}>
                  Next project sample will become public on{" "}
                  {nextPublicSampleDate}.
                </div>
              </div>
              <Divider />
              <div className={cs.userManagementFormContainer}>
                <UserManagementForm
                  csrf={csrf}
                  onUserAdded={onUserAdded}
                  project={project}
                  users={users}
                />
              </div>
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
    public_access: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
  }).isRequired,
  nextPublicSampleDate: PropTypes.string,
  users: PropTypes.array
};

export default ProjectSettingsModal;
