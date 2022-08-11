import cx from "classnames";
import React from "react";
import Accordion from "~/components/layout/Accordion";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import cs from "./metadata_section.scss";

interface MetadataSectionProps {
  className?: string;
  title: string;
  open?: boolean;
  toggleable: boolean;
  onToggle?: () => void;
  editable?: boolean;
  editing?: boolean;
  onEditToggle?: () => void;
  savePending?: boolean;
  alwaysShowEditLink?: boolean;
  children: React.ReactNode;
}

interface MetadataSectionState {
  hasSaved: boolean;
  prevSavePending: boolean;
  prevEditing: boolean;
}

class MetadataSection extends React.Component<
  MetadataSectionProps,
  MetadataSectionState
> {
  state = {
    hasSaved: false,
    prevSavePending: this.props.savePending,
    prevEditing: this.props.editing,
  };

  static getDerivedStateFromProps(
    props: MetadataSectionProps,
    state: MetadataSectionState,
  ) {
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
      prevEditing: props.editing,
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
      className,
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
        bottomContentPadding
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

export default MetadataSection;
