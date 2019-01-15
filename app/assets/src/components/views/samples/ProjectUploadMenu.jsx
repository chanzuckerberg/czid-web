import React from "react";
import cs from "./project_upload_menu.scss";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import PropTypes from "prop-types";
import MetadataUploadModal from "./MetadataUploadModal";

class ProjectUploadMenu extends React.Component {
  state = {
    modalOpen: false
  };

  goToPage = path => {
    location.href = path;
  };

  openModal = () => this.setState({ modalOpen: true });
  closeModal = () => this.setState({ modalOpen: false });

  render() {
    const trigger = (
      <div className={cs.trigger}>
        <i className="fa fa-plus-circle" />
        <span className={cs.label}>Upload</span>
      </div>
    );

    const projectUploadItems = [
      <BareDropdown.Item
        text="Upload Samples"
        key="1"
        onClick={() =>
          this.goToPage(`/samples/new?projectId=${this.props.project.id}`)
        }
      />,
      <BareDropdown.Item
        text="Upload Metadata"
        key="2"
        onClick={this.openModal}
      />
    ];
    return (
      <div>
        <BareDropdown
          trigger={trigger}
          hideArrow
          items={projectUploadItems}
          direction="left"
        />
        {this.state.modalOpen && (
          <MetadataUploadModal
            onClose={this.closeModal}
            project={this.props.project}
          />
        )}
      </div>
    );
  }
}

ProjectUploadMenu.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string
  })
};

export default ProjectUploadMenu;
