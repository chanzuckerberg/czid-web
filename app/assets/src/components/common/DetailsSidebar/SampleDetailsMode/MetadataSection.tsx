import { Button } from "@czi-sds/components";
import cx from "classnames";
import { kebabCase } from "lodash";
import React, { useEffect, useState } from "react";
import Accordion from "~/components/layout/Accordion";
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

const MetadataSection = ({
  savePending,
  editing,
  title,
  open,
  onToggle,
  editable,
  toggleable,
  children,
  onEditToggle,
  alwaysShowEditLink,
  className,
}: MetadataSectionProps) => {
  const [hasSaved, setHasSaved] = useState(false);
  const [isPrevSavePending, setIsPrevSavePending] = useState(false);

  useEffect(() => {
    // If saving has just finished, show 'All changed saved'
    if (!savePending && isPrevSavePending) {
      setHasSaved(true);
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    setIsPrevSavePending(savePending);
  }, [savePending]);

  const renderStatus = () => {
    if (savePending) {
      return <div className={cs.status}>Saving...</div>;
    }

    if (hasSaved) {
      return <div className={cs.status}>All changes saved</div>;
    }

    return null;
  };

  const header = (
    <React.Fragment>
      <div data-testid={`${kebabCase(title)}-header`} className={cs.title}>
        {title}
      </div>
      {editable &&
        (editing ? (
          renderStatus()
        ) : (
          <div
            data-testid={`${kebabCase(title)}-edit`}
            className={cx(cs.editLink, alwaysShowEditLink && cs.show)}
            onClick={e => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
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
          <Button
            sdsStyle="square"
            sdsType="primary"
            onClick={() => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
              onEditToggle();
              setHasSaved(false);
            }}
          >
            Done Editing
          </Button>
        </div>
      )}
    </Accordion>
  );
};

export default MetadataSection;
