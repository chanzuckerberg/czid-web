import React from "react";
import AccordionNotification from "~/components/ui/notifications/AccordionNotification";
import { pluralize } from "~/components/utils/stringUtil";
import cs from "./invalid_sample_deleteion_warning.scss";

interface InvalidSampleDeletionWarningProps {
  invalidSampleNames: string[];
}

const InvalidSampleDeletionWarning = ({
  invalidSampleNames,
}: InvalidSampleDeletionWarningProps) => {
  const count = invalidSampleNames.length;

  const header = (
    <div>
      <span className={cs.semibold}>
        {count} selected {pluralize("run", count)} can’t be deleted{" "}
      </span>
      because {pluralize("it", count)} {pluralize("was", count)} run by another
      user or the {pluralize("run", count)} {pluralize("is", count)} still being
      processed.
    </div>
  );

  const content = (
    <>
      {invalidSampleNames.map((name, index) => {
        return (
          <div key={index} className={cs.messageLine}>
            {name}
          </div>
        );
      })}
    </>
  );

  return (
    <AccordionNotification
      className={cs.accordion}
      type="warning"
      header={header}
      content={content}
    />
  );
};

export { InvalidSampleDeletionWarning };
