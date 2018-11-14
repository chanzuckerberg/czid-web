import React from "react";
import cx from "classnames";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import PropTypes from "prop-types";
import cs from "./metadata_section.scss";

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
    return (
      <div className={cx(cs.metadataSection, className)}>
        <div
          className={cx(cs.header, toggleable && cs.toggleable)}
          onClick={onToggle}
        >
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
          <div className={cs.fill} />
          {toggleable && (
            <div className={cs.toggleContainer}>
              <i
                className={cx(
                  "fa",
                  open ? "fa-angle-up" : "fa-angle-down",
                  cs.toggleIcon
                )}
                onClick={onToggle}
              />
            </div>
          )}
        </div>
        {(open || !toggleable) && (
          <div className={cs.content}>
            {children}
            {editing && (
              <div className={cs.controls}>
                <PrimaryButton
                  onClick={onEditToggle}
                  rectangular
                  text="Done Editing"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

MetadataSection.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  open: PropTypes.bool,
  toggleable: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  editable: PropTypes.bool,
  editing: PropTypes.bool,
  onEditToggle: PropTypes.func,
  savePending: PropTypes.bool,
  alwaysShowEditLink: PropTypes.bool,
  children: PropTypes.node
};

export default MetadataSection;
