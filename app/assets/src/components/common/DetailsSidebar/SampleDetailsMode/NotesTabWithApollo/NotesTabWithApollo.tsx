import { useQuery } from "@apollo/client";
import React, { useEffect, useState } from "react";
import Textarea from "~/components/ui/controls/Textarea";
import { federationClient } from "~/index";
import { QueryResult } from "../../../QueryResult";
import MetadataSection from "../MetadataSection";
import cs from "../sample_details_mode.scss";
import { GET_SAMPLE_NOTES } from "./queries";
import useNotesMutation from "./useSampleNotesMutation";
interface NotesTabProps {
  sampleId: number;
  editable: boolean;
}

export const NotesTabWithApollo = ({ sampleId, editable }: NotesTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inProgessNotes, setInProgessNotes] = useState<string>("");

  const { loading, error, data } = useQuery(GET_SAMPLE_NOTES, {
    variables: { sampleId },
    // TODO: (smccanny): delete this once rails and graphql are integrated under a single client
    client: federationClient,
  });

  const { updateSampleNotes, isSavePending, isSaveError } = useNotesMutation();
  const savedNotes = data?.sample?.sampleNotes || "";
  const notesEmpty = !savedNotes || savedNotes.length === 0;

  useEffect(() => {
    setInProgessNotes("");
  }, [savedNotes]);

  return (
    <QueryResult error={error} loading={loading} data={data}>
      <MetadataSection
        editable={editable}
        onEditToggle={() => setIsEditing(!isEditing)}
        editing={isEditing}
        title="Notes"
        savePending={isSavePending && !isSaveError}
        alwaysShowEditLink={notesEmpty}
        className={cs.notesSection}
        toggleable={false}
      >
        {!isEditing &&
          (notesEmpty ? (
            <div className={cs.noData}>No data</div>
          ) : (
            <div className={cs.note}>{savedNotes}</div>
          ))}
        {isEditing && (
          <div className={cs.textareaContainer}>
            <Textarea
              onChange={setInProgessNotes}
              onBlur={() => {
                updateSampleNotes(sampleId, inProgessNotes);
              }}
              value={inProgessNotes || savedNotes}
              className={cs.textarea}
            />
          </div>
        )}
      </MetadataSection>
    </QueryResult>
  );
};
