import React, { useState } from "react";
import Textarea from "~/components/ui/controls/Textarea";
import MetadataSection from "./MetadataSection";
import cs from "./sample_details_mode.scss";

interface NotesTabProps {
  notes: string | undefined | null;
  editable: boolean | undefined;
  onNoteChange: (val: string, shouldSave?: boolean) => void;
  onNoteSave: (key?: string) => Promise<void>;
  savePending: boolean;
}

const NotesTab = ({
  notes,
  onNoteChange,
  onNoteSave,
  savePending,
  editable,
}: NotesTabProps) => {
  const [editing, setEditing] = useState(false);

  const notesEmpty = !notes || notes.length === 0;

  return (
    <MetadataSection
      editable={editable}
      onEditToggle={() => setEditing(!editing)}
      editing={editing}
      title="Notes"
      savePending={savePending}
      alwaysShowEditLink={notesEmpty}
      className={cs.notesSection}
      toggleable={false}
    >
      {!editing &&
        (notesEmpty ? (
          <div className={cs.noData}>No data</div>
        ) : (
          <div className={cs.note}>{notes}</div>
        ))}
      {editing && (
        <div className={cs.textareaContainer}>
          <Textarea
            onChange={onNoteChange}
            onBlur={() => onNoteSave()}
            value={notes || ""}
            className={cs.textarea}
          />
        </div>
      )}
    </MetadataSection>
  );
};

export default NotesTab;
