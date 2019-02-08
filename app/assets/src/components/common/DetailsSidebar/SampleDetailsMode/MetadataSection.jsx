import React from "react";
import cx from "classnames";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import PropTypes from "prop-types";
import cs from "./metadata_section.scss";
import Accordion from "~/components/layout/Accordion";

class MetadataSection extends React.Component {
  state = {
    hasSaved: false,
    prevSavePending: this.props.savePending,
    prevEditing: this.props.editing
  };

  static getDerivedStateFromProps(props, state) {
    let hasSaved = state.hasSaved;

    // If we just switched to editing, hide 'All changes saved'
    if (props.editing && !state.prevEditing) {
      hasSaved = false;
    }

    // If saving has just finished, show 'All changed saved'
    if (!props.savePending && state.prevSavePending) {
      hasSaved = true;
    }

    return {
      hasSaved,
      prevSavePending: props.savePending,
      prevEditing: props.editing
    };
  }

  renderStatus = () => {
    const { savePending } = this.props;
    const { hasSaved } = this.state;

    if (savePending) {
      return <div className={cs.status}>Saving...</div>;
    }

    if (hasSaved) {
      return <div className={cs.status}>All changes saved</div>;
    }

    return null;
  };

  render() {
    const {
      title,
      open,
      onToggle,
      editing,
      editable,
      toggleable,
      children,
      onEditToggle,
      alwaysShowEditLink,
      className
    } = this.props;

    const header = (
      <React.Fragment>
        <div className={cs.title}>{title}</div>
        {editable &&
          (editing ? (
            this.renderStatus()
          ) : (
            <div
              className={cx(cs.editLink, alwaysShowEditLink && cs.show)}
              onClick={e => {
                onEditToggle();
                e.stopPropagation();
              }}
            >
              Edit
            </div>
          ))}
      </React.Fragment>
    );
    return (
      <Accordion
        className={cx(cs.metadataSection, className)}
        header={header}
        onToggle={onToggle}
        open={open}
        toggleable={toggleable}
      >
        {children}
        {editing && (
          <div className={cs.controls}>
            <PrimaryButton
              onClick={onEditToggle}
              rounded={false}
              text="Done Editing"
            />
          </div>
        )}
      </Accordion>
    );
  }
}

MetadataSection.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  open: PropTypes.bool,
  toggleable: PropTypes.bool,
  onToggle: PropTypes.func,
  editable: PropTypes.bool,
  editing: PropTypes.bool,
  onEditToggle: PropTypes.func,
  savePending: PropTypes.bool,
  alwaysShowEditLink: PropTypes.bool,
  children: PropTypes.node
};

export default MetadataSection;
