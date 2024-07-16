import { cx } from "@emotion/css";
import { get } from "lodash/fp";
import React from "react";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import PathogenLabel from "~/components/ui/labels/PathogenLabel";
import { getCategoryAdjective } from "~/components/utils/taxon";
import cs from "~/components/views/SampleView/components/MngsReport/components/ReportTable/report_table.scss";
import { HoverActions } from "~/components/views/SampleView/components/ReportPanel/components/HoverActions";
import {
  ANNOTATION_NONE,
  ANNOTATION_NOT_A_HIT,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
} from "~/components/views/SampleView/utils";
import {
  BlastData,
  ConsensusGenomeClick,
  CurrentTabSample,
} from "~/interface/sampleView";
import { SampleId, Taxon } from "~/interface/shared";
import { PhyloTreeModalParamsType } from "../../../ReportTable";
import { AnnotationMenu } from "../components/AnnotationMenu";
import { GenusLevelPreview } from "../components/GenusLevelPreview";

// The output of this function is passed to cellRenderer which takes a function of type CellRendererType
// This returns a function that returns a component, this does not return the
// component directly
export const getNameRenderer = (
  consensusGenomeData: Record<string, object[]>,
  currentTab: CurrentTabSample,
  onCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void,
  isConsensusGenomeEnabled: boolean,
  isFastaDownloadEnabled: boolean,
  isPhyloTreeAllowed: boolean,
  pipelineVersion: string,
  pipelineRunId: number | string | null,
  projectId: string,
  sampleId: SampleId,
  handlePhyloTreeModalOpen: (
    phyloTreeModalParams: PhyloTreeModalParamsType,
  ) => void,
  onAnnotationUpdate: () => void,
  onBlastClick: (params: BlastData) => void,
  onConsensusGenomeClick: (options: ConsensusGenomeClick) => void,
  onPreviousConsensusGenomeClick: (params: ConsensusGenomeClick) => void,
  onTaxonNameClick?: (clickedTaxonData: Taxon) => void,
  snapshotShareId?: string,
) =>
  function NameRenderer({
    cellData,
    rowData,
  }: {
    cellData: number;
    rowData: Taxon;
  }) {
    const analyticsContext = {
      projectId: projectId,
      sampleId: sampleId,
      taxId: rowData.taxId,
      taxLevel: rowData.taxLevel,
      taxName: rowData.name,
    };

    let childrenCount = 0;

    if (rowData.taxLevel === TAX_LEVEL_GENUS) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      childrenCount = rowData.filteredSpecies.length;
    }

    const isDimmed =
      rowData.taxLevel === TAX_LEVEL_SPECIES &&
      rowData.annotation === ANNOTATION_NOT_A_HIT;

    return (
      rowData && (
        <div className={cs.taxonContainer}>
          <span className={cs.annotationLabel}>
            <AnnotationMenu
              currentLabelType={rowData.annotation || ANNOTATION_NONE}
              analyticsContext={analyticsContext}
              onAnnotationUpdate={onAnnotationUpdate}
              pipelineRunId={pipelineRunId}
              taxonId={rowData.taxId}
            />
          </span>
          <div className={cs.taxonInfo}>
            <span
              className={cx(cs.taxonName, !!cellData || cs.missingName)}
              onClick={() =>
                onTaxonNameClick && onTaxonNameClick({ ...rowData })
              }
              onKeyDown={() =>
                onTaxonNameClick && onTaxonNameClick({ ...rowData })
              }
              role={"button"}
            >
              {cellData || rowData.name}
            </span>
            {rowData.taxLevel === TAX_LEVEL_GENUS &&
              (rowData.category ? (
                <span className={cs.countInfo}>
                  {`( `}
                  <span className={cs.italics}>
                    {`${childrenCount} ${getCategoryAdjective(
                      rowData.category,
                    )} species`}
                  </span>
                  <GenusLevelPreview rowData={rowData} />
                  {` )`}
                </span>
              ) : (
                <span className={cs.countInfo}>
                  {`( `}
                  <span className={cs.italics}>
                    {`${childrenCount} species`}
                  </span>
                  <GenusLevelPreview rowData={rowData} />
                  {` )`}
                </span>
              ))}
            <span>
              {rowData.pathogenFlag && (
                <PathogenLabel
                  type={rowData.pathogenFlag}
                  isDimmed={isDimmed}
                />
              )}
            </span>
            <span>
              <HoverActions
                className={cs.hoverActions}
                currentTab={currentTab}
                onBlastClick={onBlastClick}
                fastaEnabled={isFastaDownloadEnabled}
                onConsensusGenomeClick={onConsensusGenomeClick}
                onPreviousConsensusGenomeClick={onPreviousConsensusGenomeClick}
                previousConsensusGenomeRuns={get(
                  rowData.taxId,
                  consensusGenomeData,
                )}
                onCoverageVizClick={onCoverageVizClick}
                isPhyloTreeAllowed={isPhyloTreeAllowed}
                onPhyloTreeModalOpened={handlePhyloTreeModalOpen}
                pipelineVersion={pipelineVersion}
                snapshotShareId={snapshotShareId}
                consensusGenomeEnabled={isConsensusGenomeEnabled}
                rowData={rowData}
                sampleId={sampleId}
              />
            </span>
          </div>
        </div>
      )
    );
  };
