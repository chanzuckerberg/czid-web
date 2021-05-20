import { some } from "lodash";
import { get, isEmpty, set } from "lodash/fp";
import React, { useEffect, useState } from "react";

import { saveSampleName, saveSampleNotes, getAllSampleTypes } from "~/api";
import { logAnalyticsEvent } from "~/api/analytics";
import {
  getSampleMetadata,
  saveSampleMetadata,
  getSampleMetadataFields,
} from "~/api/metadata";
import Tabs from "~/components/ui/controls/Tabs";
import PropTypes from "~/components/utils/propTypes";
import { generateUrlToSampleView } from "~/components/utils/urls";
import { TABS as WORKFLOW_TABS } from "~/components/views/SampleView/constants";
import { processMetadata, processMetadataTypes } from "~utils/metadata";
import MetadataTab from "./MetadataTab";
import NotesTab from "./NotesTab";
import PipelineTab from "./PipelineTab";

import cs from "./sample_details_mode.scss";
import {
  processPipelineInfo,
  processAdditionalInfo,
  processCGWorkflowRunInfo,
} from "./utils";

const TABS = ["Metadata", "Pipeline", "Notes"];

const SampleDetailsMode = ({
  currentRun,
  currentWorkflowTab,
  sampleId,
  onMetadataUpdate,
  showReportLink,
  snapshotShareId,
  tempSelectedOptions,
}) => {
  const [metadata, setMetadata] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [pipelineInfo, setPipelineInfo] = useState(null);
  const [pipelineRun, setPipelineRun] = useState(null);
  const [metadataTypes, setMetadataTypes] = useState(null);
  const [metadataChanged, setMetadataChanged] = useState({});
  const [metadataSavePending, setMetadataSavePending] = useState({});
  const [lastValidMetadata, setLastValidMetadata] = useState(null);
  const [metadataErrors, setMetadataErrors] = useState({});
  const [currentTab, setCurrentTab] = useState(TABS[0]);
  const [sampleTypes, setSampleTypes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sampleId) fetchMetadata();
  }, [sampleId]);

  const onTabChange = tab => {
    setCurrentTab(tab);
    logAnalyticsEvent("SampleDetailsMode_tab_changed", {
      sampleId,
      tab,
    });
  };

  const fetchMetadata = async () => {
    setLoading(true);
    setMetadata(null);
    setAdditionalInfo(null);
    setPipelineInfo(null);

    if (!sampleId) {
      return;
    }

    const [
      fetchedMetadata,
      fetchedMetadataTypes,
      fetchedSampleTypes,
    ] = await Promise.all([
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
        : metadataTypes
    );
    setSampleTypes(fetchedSampleTypes);
    setLoading(false);
  };

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  const handleMetadataChange = (key, value, shouldSave) => {
    /* Sample name and note are special cases */
    if (key === "name" || key === "notes") {
      setAdditionalInfo(set(key, value, additionalInfo));
      setMetadataChanged(set(key, true, metadataChanged));
      return;
    }

    setMetadata(set(key, value, metadata));
    setMetadataChanged(set(key, !shouldSave, metadataChanged));
    setMetadataErrors(set(key, null, metadataErrors));

    shouldSave && _save(sampleId, key, value);

    logAnalyticsEvent("SampleDetailsMode_metadata_changed", {
      sampleId,
      key,
      shouldSave,
      metadataErrors: Object.keys(metadataErrors).length,
    });
  };

  const handleMetadataSave = async key => {
    if (metadataChanged[key]) {
      const newValue =
        key === "name" || key === "notes" ? additionalInfo[key] : metadata[key];

      setMetadataChanged(set(key, false, metadataChanged));
      _save(sampleId, key, newValue);

      logAnalyticsEvent("SampleDetailsMode_metadata_saved", {
        sampleId,
        key,
      });
    }
  };

  const _save = async (id, key, value) => {
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
          _metadata = set(key, _lastValidMetadata[key], _metadata);
        } else {
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

    if (currentTab === "Metadata") {
      return (
        <MetadataTab
          metadata={metadata}
          additionalInfo={additionalInfo}
          metadataTypes={metadataTypes}
          onMetadataChange={handleMetadataChange}
          onMetadataSave={handleMetadataSave}
          savePending={savePending}
          metadataErrors={metadataErrors}
          sampleTypes={sampleTypes || []}
          snapshotShareId={snapshotShareId}
        />
      );
    }
    if (currentTab === "Pipeline") {
      return (
        <PipelineTab
          pipelineInfo={
            currentWorkflowTab === WORKFLOW_TABS.CONSENSUS_GENOME
              ? processCGWorkflowRunInfo(currentRun)
              : pipelineInfo
          }
          erccComparison={additionalInfo.ercc_comparison}
          pipelineRun={pipelineRun}
          sampleId={sampleId}
          snapshotShareId={snapshotShareId}
        />
      );
    }
    if (currentTab === "Notes") {
      return (
        <NotesTab
          notes={additionalInfo.notes}
          editable={additionalInfo.editable}
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
        <div className={cs.title}>{additionalInfo.name}</div>
      )}
      {!loading && showReportLink && (
        <div className={cs.reportLink}>
          <a
            href={generateUrlToSampleView({
              sampleId,
              tempSelectedOptions,
            })}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() =>
              logAnalyticsEvent("SampleDetailsMode_see-report-link_clicked", {
                withTempSelectedOptions: !isEmpty(tempSelectedOptions),
              })
            }
          >
            See Report
          </a>
        </div>
      )}
      {!loading && (
        <Tabs
          className={cs.tabs}
          tabs={TABS}
          value={currentTab}
          onChange={onTabChange}
        />
      )}
      {!loading && renderTab()}
    </div>
  );
};

SampleDetailsMode.propTypes = {
  currentRun: PropTypes.object,
  sampleId: PropTypes.number,
  pipelineVersion: PropTypes.string, // Needs to be string for 3.1 vs. 3.10.
  onMetadataUpdate: PropTypes.func,
  showReportLink: PropTypes.bool,
  snapshotShareId: PropTypes.string,
  tempSelectedOptions: PropTypes.object,
};

export default SampleDetailsMode;
