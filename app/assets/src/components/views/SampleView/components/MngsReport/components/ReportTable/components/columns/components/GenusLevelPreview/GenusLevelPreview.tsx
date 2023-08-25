import { isEmpty } from "lodash/fp";
import React from "react";
import AnnotationPreview from "~/components/views/report/AnnotationPreview";
import PathogenPreview from "~/components/views/report/PathogenPreview";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NOT_A_HIT,
} from "~/components/views/SampleView/utils";
import { Taxon } from "~/interface/shared";
interface GenusLevelPreviewProps {
  rowData: Taxon;
}

export const GenusLevelPreview = ({ rowData }: GenusLevelPreviewProps) => {
  const displayAnnotationPreviews =
    "species_annotations" in rowData &&
    (rowData.species_annotations[ANNOTATION_HIT] > 0 ||
      rowData.species_annotations[ANNOTATION_NOT_A_HIT] > 0 ||
      rowData.species_annotations[ANNOTATION_INCONCLUSIVE] > 0);

  const hasPathogens = !isEmpty(rowData.pathogens);

  return (
    <>
      {/* Only show a colon if needed */}
      <span className={cs.italics}>
        {(hasPathogens || displayAnnotationPreviews) && <span>:</span>}
      </span>
      {/* Show pathogen and annotation counts */}
      {hasPathogens && <PathogenPreview tag2Count={rowData.pathogens} />}
      {displayAnnotationPreviews && (
        <AnnotationPreview tag2Count={rowData.species_annotations} />
      )}
    </>
  );
};
