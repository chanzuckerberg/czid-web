import { Button } from "czifui";
import React, { useState } from "react";
import { trackEvent } from "~/api/analytics";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import MetadataUploadModal from "./MetadataUploadModal";
import cs from "./project_upload_menu.scss";

interface ProjectUploadMenuProps {
  onMetadataUpdated?: $TSFixMeFunction;
  project?: {
    id?: number;
    name?: string;
  };
  workflow?: string;
}
const ProjectUploadMenu = ({
  onMetadataUpdated,
  project,
  workflow,
}: ProjectUploadMenuProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const goToPage = path => {
    location.href = path;
  };

  const trigger = (
    <div className={cs.trigger}>
      <Button sdsStyle="rounded" sdsType="secondary">
        Add Data
      </Button>
    </div>
  );

  const projectUploadItems = [
    <BareDropdown.Item
      text="Upload Samples"
      key="1"
      onClick={() => {
        trackEvent("ProjectUploadMenu_upload-sample-btn_clicked");
        goToPage(`/samples/upload?projectId=${project.id}`);
      }}
    />,
    <BareDropdown.Item
      text="Edit Metadata"
      key="2"
      onClick={() => setModalOpen(true)}
    />,
  ];
  return (
    <div>
      <BareDropdown
        trigger={trigger}
        hideArrow
        items={projectUploadItems}
        direction="left"
      />
      {modalOpen && (
        <MetadataUploadModal
          onClose={() => setModalOpen(false)}
          onComplete={onMetadataUpdated}
          // @ts-expect-error Property 'name' is optional in type ProjectUploadMenuProps but required in MetadataUploadModal
          project={project}
          workflow={workflow}
        />
      )}
    </div>
  );
};

export default ProjectUploadMenu;
