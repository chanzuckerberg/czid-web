import { Icon } from "@czi-sds/components";
import { compact, map } from "lodash/fp";
import React from "react";
import {
  NCBI_INDEX,
  NO_TECHNOLOGY_SELECTED,
  SEQUENCING_TECHNOLOGY_DISPLAY_NAMES,
  Technology,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
  UPLOAD_WORKFLOW_KEY_FOR_VALUE,
  WORKFLOWS_BY_UPLOAD_SELECTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { PipelineVersions, Project } from "~/interface/shared";
import cs from "./analyses_sections.scss";
import { CGAnalysisSection } from "./components/CGAnalysisSection";
import { MNGSAnalysisSection } from "./components/MNGSAnalysisSection";
import { WGSAnalysisSection } from "./components/WGSAnalysisSection";
import { AnalysisSectionsConfig } from "./workflowTypeConfig";

interface AnalysesSectionsType {
  bedFile: string;
  clearlabs: boolean;
  guppyBasecallerSetting: string;
  medakaModel: string;
  wetlabProtocol: string;
  pipelineVersions: { [projectId: string]: PipelineVersions };
  project: Project;
  refSeqFile: string;
  refSeqTaxon: string;
  technology: Technology;
  workflows: Set<UploadWorkflows>;
}

const getWorkflowSectionOrder = workflows => {
  const mngs = UPLOAD_WORKFLOWS.MNGS.value;
  const amr = UPLOAD_WORKFLOWS.AMR.value;
  const cg = UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value;
  const wgs = UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value;

  return compact([
    workflows.has(mngs) && mngs,
    workflows.has(amr) && amr,
    workflows.has(cg) && cg,
    workflows.has(wgs) && wgs,
  ]);
};

const AnalysesSections = ({
  bedFile,
  clearlabs,
  guppyBasecallerSetting,
  medakaModel,
  pipelineVersions,
  project,
  refSeqFile,
  refSeqTaxon,
  technology,
  wetlabProtocol,
  workflows,
}: AnalysesSectionsType) => {
  return (
    <div data-testid="upload-input-review">
      {map(workflow => {
        const workflowKey = UPLOAD_WORKFLOW_KEY_FOR_VALUE[workflow];
        const {
          customIcon: CustomIcon,
          icon,
          label: workflowDisplayName,
        } = UPLOAD_WORKFLOWS[workflowKey];

        const technologyForUpload =
          workflow === UPLOAD_WORKFLOWS.AMR.value
            ? NO_TECHNOLOGY_SELECTED
            : technology;

        const workflowForPipelineVersion =
          WORKFLOWS_BY_UPLOAD_SELECTIONS[workflow][technologyForUpload];
        const pipelineVersion =
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
          pipelineVersions[project.id][workflowForPipelineVersion];

        const indexDate = pipelineVersions?.[project.id][NCBI_INDEX];
        const showIndexDate = AnalysisSectionsConfig[workflow].showIndexVersion;

        return (
          <div className={cs.section}>
            <div className={cs.icon}>
              {CustomIcon ? (
                <CustomIcon />
              ) : (
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                <Icon sdsIcon={icon} sdsSize="xl" sdsType="static" />
              )}
            </div>
            <div className={cs.text}>
              <div className={cs.header}>
                <div className={cs.name}>{workflowDisplayName}</div>
              </div>
              <div className={cs.analysisTypeContent}>
                {workflow !== UPLOAD_WORKFLOWS.AMR.value && (
                  <div className={cs.item}>
                    <div className={cs.subheader}>Sequencing Platform: </div>
                    <div className={cs.description}>
                      {SEQUENCING_TECHNOLOGY_DISPLAY_NAMES[technology] ||
                        "Illumina"}
                    </div>
                  </div>
                )}
                <div className={cs.item}>
                  <div className={cs.subheader}>{"Pipeline Version: "}</div>
                  <div className={cs.description}>{pipelineVersion}</div>
                </div>
                {showIndexDate && (
                  <div className={cs.item}>
                    <div className={cs.subheader}>{"NCBI Index Date: "}</div>
                    <div className={cs.description}>{indexDate}</div>
                  </div>
                )}
                {workflow === UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value && (
                  <CGAnalysisSection
                    clearlabs={clearlabs}
                    medakaModel={medakaModel}
                    technology={technology}
                    wetlabProtocol={wetlabProtocol}
                  />
                )}
                {workflow === UPLOAD_WORKFLOWS.MNGS.value && (
                  <MNGSAnalysisSection
                    technology={technology}
                    guppyBasecallerSetting={guppyBasecallerSetting}
                  />
                )}
                {workflow === UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value && (
                  <WGSAnalysisSection
                    taxon={refSeqTaxon}
                    refSeqFile={refSeqFile}
                    bedFile={bedFile}
                  />
                )}
              </div>
            </div>
          </div>
        );
      }, getWorkflowSectionOrder(workflows))}
    </div>
  );
};

export { AnalysesSections };
