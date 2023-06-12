import { Button, Icon } from "@czi-sds/components";
import cx from "classnames";
import React from "react";
import NarrowContainer from "~/components/layout/NarrowContainer";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import List from "~/components/ui/List";
import cs from "./metadata_upload_modal.scss";

interface UploadInstructionsProps {
  onClose: $TSFixMeFunction;
  standalone?: boolean;
  size?: "small";
}
const UploadInstructions = ({
  standalone,
  onClose,
  size,
}: UploadInstructionsProps) => {
  const body = (
    <div className={cx(cs.uploadInstructions, standalone && cs.standalone)}>
      <div className={cs.header}>
        {!standalone && (
          <Button
            className={cs.backButton}
            sdsStyle="minimal"
            sdsType="primary"
            isAllCaps={false}
            startIcon={
              <Icon sdsIcon="chevronLeft" sdsSize="xs" sdsType="static" />
            }
            onClick={onClose}
          >
            Back
          </Button>
        )}
        <div className={cs.title}>How to Upload a Metadata CSV</div>
      </div>
      <div className={cs.content}>
        <div className={cs.sectionTitle}>Instructions</div>
        <List
          listClassName={cs.section}
          ordered={true}
          listItems={[
            <React.Fragment key={"metadata-dictionary"}>
              Review the fields in our{" "}
              <ExternalLink href="/metadata/dictionary" className={cs.link}>
                metadata dictionary
              </ExternalLink>
              , where you will find definitions and format requirements. Take
              special note of the <b>required</b> fields, which you must provide
              when uploading a new sample.
            </React.Fragment>,
            <React.Fragment key={"metadata-template-csv"}>
              You can use your own CSV or copy your metadata into our{" "}
              <a
                href="/metadata/metadata_template_csv"
                target="_blank"
                rel="noopener noreferrer"
                className={cs.link}
              >
                CSV template.
              </a>
              <p>
                {`If your entered Host Organism does not match a supported host
                genome, we will only subtract out ERCCs and the Human genome. You can
                read more about how to request a new genome to be added to CZ ID `}
                <a
                  href="https://help.czid.org/hc/en-us/articles/360034790814-How-do-I-request-a-new-host-genome-be-added-to-CZID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cs.link}
                >
                  here.
                </a>
              </p>
            </React.Fragment>,
            `Make sure your column headers match our naming convention.`,
            `Make sure your metadata values are in the correct format.`,
            `Upload your CSV file.`,
            `If there are errors, please make the necessary changes in your CSV
              and upload it again.`,
          ]}
        />
      </div>
    </div>
  );

  return standalone ? (
    <NarrowContainer size={size}>{body}</NarrowContainer>
  ) : (
    body
  );
};

export default UploadInstructions;
