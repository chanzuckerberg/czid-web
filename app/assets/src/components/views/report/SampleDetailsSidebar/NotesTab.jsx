import React from "react";
import MetadataSection from "./MetadataSection";
import Textarea from "~/components/ui/controls/Textarea";
import PropTypes from "prop-types";
import cs from "./sample_details_sidebar.scss";

class NotesTab extends React.Component {
  state = {
    editing: false
  };

  toggleEditing = () => {
    this.setState({
      editing: !this.state.editing
    });
  };

  render() {
    const { notes, onNoteChange, onNoteSave, savePending } = this.props;

    const notesEmpty = !notes || notes.length === 0;

    return (
      <MetadataSection
        editable
        onEditToggle={() => this.toggleEditing()}
        editing={this.state.editing}
        title="Notes"
        savePending={savePending}
        alwaysShowEditLink={notesEmpty}
        className={cs.notesSection}
      >
        {!this.state.editing &&
          (notesEmpty ? (
            <div className={cs.noData}>No data</div>
          ) : (
            <div className={cs.note}>{notes}</div>
          ))}
        {this.state.editing && (
          <div className={cs.textareaContainer}>
            <Textarea
              onChange={val => onNoteChange(val)}
              onBlur={() => onNoteSave()}
              value={notes}
              className={cs.textarea}
            />
          </div>
        )}
      </MetadataSection>
    );
  }
}

NotesTab.propTypes = {
  notes: PropTypes.string,
  onNoteChange: PropTypes.func.isRequired,
  onNoteSave: PropTypes.func.isRequired,
  savePending: PropTypes.bool
};

export default NotesTab;
