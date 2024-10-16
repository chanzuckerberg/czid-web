import { Icon } from "@czi-sds/components";
import axios from "axios";
import cx from "classnames";
import React, { useContext, useState } from "react";
import { UserContext } from "~/components/common/UserContext";
import Divider from "~/components/layout/Divider";
import { EDIT_SNAPSHOT_LINKS_FEATURE } from "~/components/utils/features";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Modal from "~ui/containers/Modal";
import ShareButton from "~ui/controls/buttons/ShareButton";
import cs from "./project_settings_modal.scss";
import PublicProjectConfirmationModal from "./PublicProjectConfirmationModal";
import UserManagementForm from "./UserManagementForm";
import ViewOnlyLinkForm from "./ViewOnlyLinkForm";

interface ProjectSettingsModalProps {
  csrf: string;
  onUserAdded?: $TSFixMeFunction;
  onProjectPublished?: $TSFixMeFunction;
  project: {
    id?: string;
    creator_id?: number;
    name?: string;
    public_access?: boolean | number;
  };
  users?: { name: string; email: string }[];
}

const ProjectSettingsModal = ({
  csrf,
  onProjectPublished,
  onUserAdded,
  project,
  users,
}: ProjectSettingsModalProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { allowedFeatures = [], userId } = useContext(UserContext) || {};
  const makeProjectPublic = () => {
    axios
      .put(`/projects/${project.id}.json`, {
        public_access: true,
        authenticity_token: csrf,
      })
      .then(() => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        onProjectPublished();
      });
  };

  return (
    <div>
      <ShareButton onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <Modal
          open
          narrow
          onClose={() => setModalOpen(false)}
          className={cs.projectSettingsModal}
        >
          <div className={cs.projectSettingsContent}>
            <div className={cs.title}>
              Share <span className={cs.highlight}>{project.name}</span>
            </div>
            <div className={cx(cs.background, cs.projectVisibility)}>
              {project.public_access ? (
                <div className={cs.visibility}>
                  <div className={cs.icon}>
                    <Icon
                      sdsIcon="projectPublic"
                      sdsSize="xl"
                      sdsType="static"
                    />
                  </div>
                  <div className={cs.text}>
                    <div className={cs.label}>Public Project</div>
                    <div className={cs.note}>
                      This project is viewable and searchable to anyone in CZ
                      ID, and they’ll be able to perform actions like create
                      heatmaps and download.
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cs.visibility}>
                  <div className={cs.icon}>
                    <Icon
                      sdsIcon="projectPrivate"
                      sdsSize="xl"
                      sdsType="static"
                    />
                  </div>
                  <div className={cs.text}>
                    <div className={cs.header}>
                      <div className={cs.label}>Private Project</div>
                      <div className={cs.toggle}>
                        <PublicProjectConfirmationModal
                          onConfirm={makeProjectPublic}
                          project={project}
                          trigger={
                            <ColumnHeaderTooltip
                              trigger={<span>Change to public</span>}
                              content="Changing this project to Public will allow anyone signed into CZ ID to view and use your samples."
                            />
                          }
                        />
                      </div>
                    </div>
                    <div className={cs.note}>
                      Samples added will be private by default, visible only to
                      project members.
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
            {allowedFeatures.includes(EDIT_SNAPSHOT_LINKS_FEATURE) &&
              project.creator_id === userId && (
                <div>
                  <Divider />
                  <div className={cs.formContainer}>
                    <ViewOnlyLinkForm project={project} />
                  </div>
                </div>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectSettingsModal;
