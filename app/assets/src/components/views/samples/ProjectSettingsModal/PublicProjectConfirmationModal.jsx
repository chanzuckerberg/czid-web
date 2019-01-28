import React from "react";
import PropTypes from "prop-types";
import Modal from "~ui/containers/Modal";
import { PrimaryButton, SecondaryButton } from "~ui/controls/buttons";
import cs from "./public_project_confirmation_modal.scss";

class PublicProjectConfirmationModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalOpen: false
    };
  }

  openModal = () => {
    this.setState({ modalOpen: true });
  };
  closeModal = () => this.setState({ modalOpen: false });

  handleConfirm = () => {
    const { onConfirm } = this.props;
    this.setState({ modalOpen: false }, onConfirm);
  };

  render() {
    const { project, trigger } = this.props;
    return (
      <div>
        <div onClick={this.openModal}>{trigger}</div>
        {this.state.modalOpen && (
          <Modal className={cs.publicProjectConfirmation} narrow open>
            <div className={cs.title}>
              Make <span className={cs.highlight}>{project.name}</span> public
            </div>
            <div className={cs.text}>
              <p>
                By making this project public, anyone who has access to IDseq
                will be able to see your project and the included samples. When
                you upload a new sample to this project, it will automatically
                be available for all IDseq users. This action is{" "}
                <span className={cs.highlight}>not reversible</span>.
              </p>
              <p>
                For more information, view our{" "}
                <span
                  className={cs.link}
                  onClick={() =>
                    window.open("https://assets.idseq.net/Privacy.pdf")
                  }
                >
                  privacy policy
                </span>{" "}
                or{" "}
                <span
                  className={cs.link}
                  onClick={() =>
                    window.open("https://assets.idseq.net/TermsOfService.pdf")
                  }
                >
                  terms of service
                </span>
                .
              </p>
            </div>
            <div className={cs.actions}>
              <div className={cs.item}>
                <PrimaryButton
                  text="Make Project Public"
                  onClick={this.handleConfirm}
                />
              </div>
              <div className={cs.item}>
                <SecondaryButton onClick={this.closeModal} text="Cancel" />
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }
}

PublicProjectConfirmationModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    public_access: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
  }).isRequired,
  trigger: PropTypes.node
};

export default PublicProjectConfirmationModal;
