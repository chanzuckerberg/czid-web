import { isEmpty } from "lodash/fp";
import React from "react";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import {
  ANNOTATION_HIT,
  ANNOTATION_INCONCLUSIVE,
  ANNOTATION_NOT_A_HIT,
} from "~/components/views/SampleView/utils";
import { Taxon } from "~/interface/shared";
import { AnnotationPreview } from "./components/AnnotationPreview";
import { PathogenPreview } from "./components/PathogenPreview";
interface GenusLevelPreviewProps {
  rowData: Taxon;
}

export const GenusLevelPreview = ({ rowData }: GenusLevelPreviewProps) => {
  const displayAnnotationPreviews =
    "species_annotations" in rowData &&
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    (rowData.species_annotations[ANNOTATION_HIT] > 0 ||
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      rowData.species_annotations[ANNOTATION_NOT_A_HIT] > 0 ||
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      rowData.species_annotations[ANNOTATION_INCONCLUSIVE] > 0);

  const hasPathogens = !isEmpty(rowData.pathogens);

  return (
    <>
      {/* Only show a colon if needed */}
      <span className={cs.italics}>
        {(hasPathogens || displayAnnotationPreviews) && <span>:</span>}
      </span>
      {/* Show pathogen and annotation counts */}
      {/* @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322 */}
      {hasPathogens && <PathogenPreview tag2Count={rowData.pathogens} />}
      {displayAnnotationPreviews && (
        <AnnotationPreview tag2Count={rowData.species_annotations} />
      )}
    </>
  );
};
