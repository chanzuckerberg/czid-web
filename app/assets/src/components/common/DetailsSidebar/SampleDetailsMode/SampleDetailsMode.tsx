import { some } from "lodash";
import { find, get, set, size } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { getAllSampleTypes, saveSampleName, saveSampleNotes } from "~/api";
import {
  getSampleMetadata,
  getSampleMetadataFields,
  saveSampleMetadata,
} from "~/api/metadata";
import Tabs from "~/components/ui/controls/Tabs";
import {
  generateUrlToSampleView,
  TempSelectedOptionsShape,
} from "~/components/utils/urls";
import { WorkflowType, WORKFLOW_TABS } from "~/components/utils/workflows";
import { ConsensusGenomeDropdown } from "~/components/views/SampleView/components/ConsensusGenomeView/components/ConsensusGenomeHeader/components/ConsensusGenomeDropdown";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import {
  LocationObject,
  Metadata,
  MetadataTypes,
  PipelineRun,
  SampleId,
  SnapshotShareId,
} from "~/interface/shared";
import { processMetadata, processMetadataTypes } from "~utils/metadata";
import { MetadataTab } from "./components/MetadataTab";
import { SIDEBAR_TABS } from "./constants";
import NotesTab from "./NotesTab";
import PipelineTab, { MngsPipelineInfo, PipelineInfo } from "./PipelineTab";
import cs from "./sample_details_mode.scss";
import { AdditionalInfo, SidebarTabName } from "./types";
import {
  processAdditionalInfo,
  processAMRWorkflowRun,
  processCGWorkflowRunInfo,
  processPipelineInfo,
} from "./utils";

export interface SampleDetailsModeProps {
  currentRun?: WorkflowRun | PipelineRun;
  currentWorkflowTab?: CurrentTabSample;
  handleWorkflowTabChange?: (tab: CurrentTabSample) => void;
  sample?: Sample;
  sampleId: SampleId;
  sampleWorkflowLabels?: string[];
  onMetadataUpdate?: (key: $TSFixMeUnknown, value: $TSFixMeUnknown) => void;
  onWorkflowRunSelect?: $TSFixMeFunction;
  snapshotShareId?: SnapshotShareId;
  pipelineVersion?: string; // Needs to be string for 3.1 vs. 3.10.
  showReportLink?: boolean;
  tempSelectedOptions?: TempSelectedOptionsShape;
}

const SampleDetailsMode = ({
  currentRun,
  currentWorkflowTab,
  handleWorkflowTabChange,
  sample,
  sampleId,
  onMetadataUpdate,
  onWorkflowRunSelect,
  showReportLink,
  snapshotShareId,
  tempSelectedOptions,
  sampleWorkflowLabels,
}: SampleDetailsModeProps) => {
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo | null>(
    null,
  );
  const [currentTabSidebar, setCurrentTabSidebar] = useState(SIDEBAR_TABS[0]);
  const [lastValidMetadata, setLastValidMetadata] = useState<Metadata | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [metadataChanged, setMetadataChanged] = useState<
    Record<string, boolean>
  >({});
  const [metadataErrors, setMetadataErrors] = useState<
    Record<string, string | null>
  >({});
  const [metadataSavePending, setMetadataSavePending] = useState<
    Record<string, boolean>
  >({});
  const [metadataTypes, setMetadataTypes] = useState<MetadataTypes | null>(
    null,
  );
  const [pipelineInfo, setPipelineInfo] = useState<MngsPipelineInfo | null>(
    null,
  );
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [sampleTypes, setSampleTypes] = useState(null);
  const [singleKeyValueToSave, setSingleKeyValueToSave] = useState<
    [string, string | number | LocationObject] | null
  >(null);

  useEffect(() => {
    if (sampleId) fetchMetadata();
  }, [sampleId]);

  useEffect(() => {
    // _save relies on this.state.metadata being up-to-date
    if (singleKeyValueToSave) {
      const [key, value] = singleKeyValueToSave;
      _save(sampleId, key, value);
      setSingleKeyValueToSave(null);
    }
  }, [metadata]);

  const onTabChange = (tab: SidebarTabName) => {
    setCurrentTabSidebar(tab);
  };

  const fetchMetadata = async () => {
    setLoading(true);
    setMetadata(null);
    setAdditionalInfo(null);
    setPipelineInfo(null);

    if (!sampleId) {
      return;
    }

    const [fetchedMetadata, fetchedMetadataTypes, fetchedSampleTypes] =
      await Promise.all([
        getSampleMetadata({
          id: sampleId,
          pipelineVersion: get("pipeline_version", currentRun),
          snapshotShareId,
        }),
        getSampleMetadataFields(sampleId, snapshotShareId),
        !snapshotShareId && getAllSampleTypes(),
      ]);

    const processedMetadata = processMetadata({
      metadata: fetchedMetadata.metadata,
      flatten: true,
    });

    setMetadata(processedMetadata);
    setLastValidMetadata(processedMetadata);
    setAdditionalInfo(processAdditionalInfo(fetchedMetadata.additional_info));
    setPipelineInfo(processPipelineInfo(fetchedMetadata.additional_info));
    setPipelineRun(fetchedMetadata.additional_info.pipeline_run);
    setMetadataTypes(
      fetchedMetadataTypes
        ? processMetadataTypes(fetchedMetadataTypes)
        : metadataTypes,
    );
    setSampleTypes(fetchedSampleTypes);
    setLoading(false);
  };

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  const handleMetadataChange = (
    key: string,
    value: string | number | LocationObject,
    shouldSave?: boolean,
  ) => {
    /* Sample name and note are special cases */
    if (key === "name" || key === "notes") {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
      setAdditionalInfo(set(key, value, additionalInfo));
      setMetadataChanged(set(key, true, metadataChanged));
      return;
    }
    if (shouldSave) {
      setSingleKeyValueToSave([key, value]);
    }
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
    setMetadata(set(key, value, metadata));
    setMetadataChanged(set(key, !shouldSave, metadataChanged));
    setMetadataErrors(set(key, null, metadataErrors));
  };

  const handleMetadataSave = async (key: string) => {
    if (metadataChanged[key]) {
      const newValue =
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        key === "name" || key === "notes" ? additionalInfo[key] : metadata[key];

      setMetadataChanged(set(key, false, metadataChanged));
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      _save(sampleId, key, newValue);
    }
  };

  const _save = async (
    id: number | string,
    key: string,
    value: string | number | LocationObject,
  ) => {
    let _lastValidMetadata = lastValidMetadata;
    let _metadataErrors = metadataErrors;
    let _metadata = metadata;

    // When metadata is saved, fire event.
    if (onMetadataUpdate) {
      onMetadataUpdate(key, value);
    }

    setMetadataSavePending(set(key, true, metadataSavePending));
    if (key === "name") {
      await saveSampleName(id, value);
    } else if (key === "notes") {
      await saveSampleNotes(id, value);
    } else {
      await saveSampleMetadata(sampleId, key, value).then(response => {
        // If the save fails, immediately revert to the last valid metadata value.
        if (response.status === "failed") {
          _metadataErrors = set(key, response.message, _metadataErrors);
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
          _metadata = set(key, _lastValidMetadata[key], _metadata);
        } else {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
          _lastValidMetadata = set(key, value, _lastValidMetadata);
        }
      });
    }

    setMetadataSavePending(set(key, false, metadataSavePending));
    setMetadataErrors(_metadataErrors);
    setMetadata(_metadata);
    setLastValidMetadata(_lastValidMetadata);
  };

  const renderTab = () => {
    const savePending = some(metadataSavePending);

    if (currentTabSidebar === "Metadata") {
      return (
        <MetadataTab
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          metadata={metadata}
          additionalInfo={additionalInfo}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          metadataTypes={metadataTypes}
          onMetadataChange={handleMetadataChange}
          onMetadataSave={handleMetadataSave}
          savePending={savePending}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          metadataErrors={metadataErrors}
          sampleTypes={sampleTypes || []}
          snapshotShareId={snapshotShareId}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          currentWorkflowTab={currentWorkflowTab}
        />
      );
    }
    if (currentTabSidebar === "Pipelines") {
      const workflowTabs = size(sampleWorkflowLabels) > 1 && (
        <Tabs
          className={cs.workflowTabs}
          tabStyling={cs.tabLabels}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          tabs={sampleWorkflowLabels}
          value={currentWorkflowTab}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onChange={handleWorkflowTabChange}
          hideBorder
        />
      );

      const consensusGenomeWorkflowRuns =
        sample &&
        sample.workflow_runs?.filter(
          run => run.workflow === WorkflowType.CONSENSUS_GENOME,
        );

      let pipelineInfoForTab: PipelineInfo | null = pipelineInfo;
      if (currentWorkflowTab === WORKFLOW_TABS.CONSENSUS_GENOME) {
        pipelineInfoForTab = processCGWorkflowRunInfo(currentRun);
      } else if (currentWorkflowTab === WORKFLOW_TABS.AMR) {
        pipelineInfoForTab = processAMRWorkflowRun(currentRun as WorkflowRun);
      }

      return (
        <>
          {workflowTabs}
          {currentWorkflowTab === WORKFLOW_TABS.CONSENSUS_GENOME &&
            consensusGenomeWorkflowRuns &&
            size(consensusGenomeWorkflowRuns) > 1 && (
              <div className={cs.dropdownContainer}>
                <ConsensusGenomeDropdown
                  workflowRuns={consensusGenomeWorkflowRuns}
                  initialSelectedValue={currentRun?.id}
                  onConsensusGenomeSelection={workflowRunId =>
                    onWorkflowRunSelect &&
                    onWorkflowRunSelect(
                      find({ id: workflowRunId }, consensusGenomeWorkflowRuns),
                    )
                  }
                />
              </div>
            )}
          <PipelineTab
            pipelineInfo={pipelineInfoForTab}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
            erccComparison={additionalInfo.ercc_comparison}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            pipelineRun={pipelineRun}
            sampleId={sampleId}
            snapshotShareId={snapshotShareId}
          />
        </>
      );
    }
    if (currentTabSidebar === "Notes") {
      return (
        <NotesTab
          notes={additionalInfo?.notes}
          editable={additionalInfo?.editable}
          onNoteChange={val => handleMetadataChange("notes", val)}
          onNoteSave={() => handleMetadataSave("notes")}
          savePending={savePending}
        />
      );
    }
    return null;
  };

  return (
    <div className={cs.content}>
      {loading ? (
        <div className={cs.loadingMsg}>Loading...</div>
      ) : (
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        <div className={cs.title}>{additionalInfo.name}</div>
      )}
      {!loading && showReportLink && (
        <div className={cs.reportLink}>
          <a
            href={generateUrlToSampleView({
              sampleId: sampleId.toString(),
              tempSelectedOptions,
            })}
            target="_blank"
            rel="noreferrer noopener"
            // this is broken, but alldoami found it while working on something unrelated
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClick={() => {}}
          >
            See Report
          </a>
        </div>
      )}
      {!loading && (
        <Tabs
          className={cs.tabs}
          tabs={SIDEBAR_TABS}
          value={currentTabSidebar}
          onChange={onTabChange}
        />
      )}
      {!loading && renderTab()}
    </div>
  );
};

export default SampleDetailsMode;
