import React, { useState } from "react";
import { graphql, useFragment } from "react-relay";
import Textarea from "~/components/ui/controls/Textarea";
import MetadataSection from "../../MetadataSection";
import cs from "../../sample_details_mode.scss";
import { NotesTabFragment$key } from "./__generated__/NotesTabFragment.graphql";

export const NotesTabFragment = graphql`
  fragment NotesTabFragment on SampleMetadata {
    additional_info {
      notes
      editable
    }
  }
`;

interface NotesTabProps {
  notesFragmentKey?: NotesTabFragment$key | null;
  onNoteChange: (val: string, shouldSave?: boolean) => void;
  onNoteSave: (notes: string | null | undefined) => Promise<void>;
  savePending: boolean;
}

export const NotesTab = ({
  notesFragmentKey,
  onNoteChange,
  onNoteSave,
  savePending,
}: NotesTabProps) => {
  const data =
    notesFragmentKey &&
    useFragment<NotesTabFragment$key>(NotesTabFragment, notesFragmentKey);
  const notes = data?.additional_info?.notes;

  const [notesLocal, setNotesLocal] = useState(data?.additional_info?.notes);
  const [isEditing, setIsEditing] = useState(false);
  const onNoteChangeWrapper = (val: string) => {
    setNotesLocal(val);
    onNoteChange(val);
  };

  const isEditable = data?.additional_info?.editable;
  const notesEmpty = !notes || notes.length === 0;

  return (
    <MetadataSection
      editable={isEditable}
      onEditToggle={() => setIsEditing(!isEditing)}
      editing={isEditing}
      title="Notes"
      savePending={savePending}
      alwaysShowEditLink={notesEmpty}
      className={cs.notesSection}
      toggleable={false}
    >
      {!isEditing &&
        (notesEmpty ? (
          <div className={cs.noData}>No data</div>
        ) : (
          <div className={cs.note}>{notesLocal}</div>
        ))}
      {isEditing && (
        <div className={cs.textareaContainer}>
          <Textarea
            onChange={val => onNoteChangeWrapper(val)}
            onBlur={() => onNoteSave(notesLocal)}
            value={notesLocal ?? ""}
            className={cs.textarea}
          />
        </div>
      )}
    </MetadataSection>
  );
};
