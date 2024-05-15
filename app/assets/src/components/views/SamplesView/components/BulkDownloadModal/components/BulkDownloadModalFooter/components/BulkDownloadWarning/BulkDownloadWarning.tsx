import React from "react";
import AccordionNotification from "~/components/ui/notifications/AccordionNotification";
import cs from "./bulk_download_warning.scss";

interface BulkDownloadWarningProps {
  message: string;
  sampleNames: string[];
}

export const BulkDownloadWarning = ({
  message,
  sampleNames,
}: BulkDownloadWarningProps) => {
  return (
    <AccordionNotification
      header={
        <div>
          <span className={cs.highlight}>
            {sampleNames.length} sample
            {sampleNames.length > 1 ? "s" : ""} won&apos;t be included in the
            bulk download
          </span>
          {message}
        </div>
      }
      content={
        <span>
          {sampleNames.map((name, index) => {
            return (
              <div key={index} className={cs.messageLine}>
                {name}
              </div>
            );
          })}
        </span>
      }
      open={false}
      type={"warning"}
      displayStyle={"flat"}
    />
  );
};
