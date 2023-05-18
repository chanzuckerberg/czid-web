import { Icon } from "czifui";
import { compact, map } from "lodash/fp";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import StatusLabel from "~/components/ui/labels/StatusLabel";
import {
  AMR_V2_FEATURE,
  ONT_V1_HARD_LAUNCH_FEATURE,
} from "~/components/utils/features";
import {
  NO_TECHNOLOGY_SELECTED,
  SEQUENCING_TECHNOLOGY_DISPLAY_NAMES,
  SEQUENCING_TECHNOLOGY_OPTIONS,
  Technology,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
  UPLOAD_WORKFLOW_KEY_FOR_VALUE,
  WORKFLOWS_BY_UPLOAD_SELECTIONS,
} from "~/components/views/SampleUploadFlow/constants";
import { Project, ProjectPipelineVersions } from "~/interface/shared";
import cs from "./analyses_sections.scss";
import { CGAnalysisSection } from "./components/CGAnalysisSection/CGAnalysisSection";
import { MNGSAnalysisSection } from "./components/MNGSAnalysisSection";
import { WGSAnalysisSection } from "./components/WGSAnalysisSection";

interface AnalysesSectionsType {
  bedFile: string;
  clearlabs: boolean;
  guppyBasecallerSetting: string;
  medakaModel: string;
  wetlabProtocol: string;
  pipelineVersions: { [projectId: string]: ProjectPipelineVersions };
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
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext ?? {};

  return (
    <>
      {map(workflow => {
        const workflowKey = UPLOAD_WORKFLOW_KEY_FOR_VALUE[workflow];
        const {
          customIcon: CustomIcon,
          icon,
          label: workflowDisplayName,
        } = UPLOAD_WORKFLOWS[workflowKey];

        const workflowIsBeta =
          workflow === UPLOAD_WORKFLOWS.AMR.value &&
          !allowedFeatures.includes(AMR_V2_FEATURE);

        const sequencingPlatformIsBeta =
          !allowedFeatures.includes(ONT_V1_HARD_LAUNCH_FEATURE) &&
          workflow === UPLOAD_WORKFLOWS.MNGS.value &&
          technology === SEQUENCING_TECHNOLOGY_OPTIONS.NANOPORE;

        const technologyForUpload =
          workflow === UPLOAD_WORKFLOWS.AMR.value
            ? NO_TECHNOLOGY_SELECTED
            : technology;

        const workflowForPipelineVersion =
          WORKFLOWS_BY_UPLOAD_SELECTIONS[workflow][technologyForUpload];
        const pipelineVersion =
          pipelineVersions[project.id][workflowForPipelineVersion];

        return (
          <div className={cs.section}>
            <div className={cs.icon}>
              {CustomIcon ? (
                <CustomIcon />
              ) : (
                <Icon sdsIcon={icon} sdsSize="xl" sdsType="static" />
              )}
            </div>
            <div className={cs.text}>
              <div className={cs.header}>
                <div className={cs.name}>{workflowDisplayName}</div>
                {workflowIsBeta && (
                  <StatusLabel inline status="Beta" type="beta" />
                )}
              </div>
              <div className={cs.analysisTypeContent}>
                {workflow !== UPLOAD_WORKFLOWS.AMR.value && (
                  <div className={cs.item}>
                    <div className={cs.subheader}>Sequencing Platform: </div>
                    <div className={cs.description}>
                      {SEQUENCING_TECHNOLOGY_DISPLAY_NAMES[technology] ||
                        "Illumina"}
                      {sequencingPlatformIsBeta && (
                        <StatusLabel inline status="Beta" type="beta" />
                      )}
                    </div>
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
                <div className={cs.item}>
                  <div className={cs.subheader}>{"Pipeline Version: "}</div>
                  <div className={cs.description}>{pipelineVersion}</div>
                </div>
              </div>
            </div>
          </div>
        );
      }, getWorkflowSectionOrder(workflows))}
    </>
  );
};

export { AnalysesSections };
