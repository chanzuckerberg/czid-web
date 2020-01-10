import React from "react";
import { some } from "lodash";
import { set } from "lodash/fp";

import PropTypes from "~/components/utils/propTypes";
import Tabs from "~/components/ui/controls/Tabs";
import { saveSampleName, saveSampleNotes, getAllSampleTypes } from "~/api";
import {
  getSampleMetadata,
  saveSampleMetadata,
  getSampleMetadataFields,
} from "~/api/metadata";
import { logAnalyticsEvent } from "~/api/analytics";
import { processMetadata, processMetadataTypes } from "~utils/metadata";

import MetadataTab from "./MetadataTab";
import PipelineTab from "./PipelineTab";
import NotesTab from "./NotesTab";
import { processPipelineInfo, processAdditionalInfo } from "./utils";
import cs from "./sample_details_mode.scss";

const TABS = ["Metadata", "Pipeline", "Notes"];

class SampleDetailsMode extends React.Component {
  state = {
    metadata: null,
    additionalInfo: null,
    pipelineInfo: null,
    metadataTypes: null,
    metadataChanged: {},
    metadataSavePending: {},
    lastValidMetadata: null,
    metadataErrors: {},
    currentTab: TABS[0],
  };

  onTabChange = tab => {
    this.setState({ currentTab: tab });
    logAnalyticsEvent("SampleDetailsMode_tab_changed", {
      sampleId: this.props.sampleId,
      tab,
    });
  };

  componentDidMount() {
    if (this.props.sampleId) {
      this.fetchMetadata();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.sampleId !== prevProps.sampleId) {
      this.fetchMetadata();
    }
  }

  fetchMetadata = async () => {
    const { sampleId, pipelineVersion } = this.props;
    this.setState({
      metadata: null,
      additionalInfo: null,
      pipelineInfo: null,
    });

    if (!sampleId) {
      return;
    }

    const [metadata, metadataTypes, sampleTypes] = await Promise.all([
      getSampleMetadata(sampleId, pipelineVersion),
      getSampleMetadataFields(sampleId),
      getAllSampleTypes(),
    ]);

    const processedMetadata = processMetadata(metadata.metadata, true);

    this.setState({
      metadata: processedMetadata,
      lastValidMetadata: processedMetadata,
      additionalInfo: processAdditionalInfo(metadata.additional_info),
      pipelineInfo: processPipelineInfo(metadata.additional_info),
      pipelineRun: metadata.additional_info.pipeline_run,
      metadataTypes: metadataTypes
        ? processMetadataTypes(metadataTypes)
        : this.state.metadataTypes,
      sampleTypes,
    });
  };

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  handleMetadataChange = (key, value, shouldSave) => {
    /* Sample name and note are special cases */
    if (key === "name" || key === "notes") {
      this.setState({
        additionalInfo: set(key, value, this.state.additionalInfo),
        metadataChanged: set(key, true, this.state.metadataChanged),
      });

      return;
    }

    this.setState(
      {
        metadata: set(key, value, this.state.metadata),
        metadataChanged: set(key, !shouldSave, this.state.metadataChanged),
        metadataErrors: set(key, null, this.state.metadataErrors),
      },
      () => {
        if (shouldSave) {
          this._save(this.props.sampleId, key, value);
        }
      }
    );

    logAnalyticsEvent("SampleDetailsMode_metadata_changed", {
      sampleId: this.props.sampleId,
      key,
      value,
      shouldSave,
      metadataErrors: Object.keys(this.state.metadataErrors).length,
    });
  };

  handleMetadataSave = async key => {
    if (this.state.metadataChanged[key]) {
      const newValue =
        key === "name" || key === "notes"
          ? this.state.additionalInfo[key]
          : this.state.metadata[key];

      this.setState(
        {
          metadataChanged: set(key, false, this.state.metadataChanged),
        },
        () => {
          this._save(this.props.sampleId, key, newValue);
        }
      );

      logAnalyticsEvent("SampleDetailsMode_metadata_saved", {
        sampleId: this.props.sampleId,
        key,
        newValue,
      });
    }
  };

  _save = async (id, key, value) => {
    // When metadata is saved, fire event.
    if (this.props.onMetadataUpdate) {
      this.props.onMetadataUpdate(key, value);
    }

    this.setState({
      metadataSavePending: set(key, true, this.state.metadataSavePending),
    });

    let lastValidMetadata = this.state.lastValidMetadata;
    let metadataErrors = this.state.metadataErrors;
    let metadata = this.state.metadata;

    if (key === "name") {
      await saveSampleName(id, value);
    } else if (key === "notes") {
      await saveSampleNotes(id, value);
    } else {
      const response = await saveSampleMetadata(
        this.props.sampleId,
        key,
        value
      );

      // If the save fails, immediately revert to the last valid metadata value.
      if (response.status === "failed") {
        metadataErrors = set(key, response.message, metadataErrors);
        metadata = set(key, lastValidMetadata[key], metadata);
      } else {
        lastValidMetadata = set(key, value, lastValidMetadata);
      }
    }

    this.setState({
      metadataSavePending: set(key, false, this.state.metadataSavePending),
      metadataErrors,
      metadata,
      lastValidMetadata,
    });
  };

  renderTab = () => {
    const {
      metadata,
      metadataTypes,
      metadataSavePending,
      additionalInfo,
      pipelineInfo,
      pipelineRun,
      metadataErrors,
      sampleTypes,
    } = this.state;

    const savePending = some(metadataSavePending);

    if (this.state.currentTab === "Metadata") {
      return (
        <MetadataTab
          metadata={metadata}
          additionalInfo={additionalInfo}
          metadataTypes={metadataTypes}
          onMetadataChange={this.handleMetadataChange}
          onMetadataSave={this.handleMetadataSave}
          savePending={savePending}
          metadataErrors={metadataErrors}
          sampleTypes={sampleTypes}
        />
      );
    }
    if (this.state.currentTab === "Pipeline") {
      return (
        <PipelineTab
          pipelineInfo={pipelineInfo}
          erccComparison={additionalInfo.ercc_comparison}
          pipelineRun={pipelineRun}
          sampleId={this.props.sampleId}
        />
      );
    }
    if (this.state.currentTab === "Notes") {
      return (
        <NotesTab
          notes={additionalInfo.notes}
          editable={additionalInfo.editable}
          onNoteChange={val => this.handleMetadataChange("notes", val)}
          onNoteSave={() => this.handleMetadataSave("notes")}
          savePending={savePending}
        />
      );
    }
    return null;
  };

  render() {
    const { showReportLink, sampleId } = this.props;
    const { metadata, metadataTypes, additionalInfo } = this.state;

    const loading = !metadata || !metadataTypes;

    return (
      <div className={cs.content}>
        {loading ? (
          <div className={cs.loadingMsg}>Loading...</div>
        ) : (
          <div className={cs.title}>{additionalInfo.name}</div>
        )}
        {!loading &&
          showReportLink && (
            <div className={cs.reportLink}>
              <a href={`/samples/${sampleId}`}>See Report</a>
            </div>
          )}
        {!loading && (
          <Tabs
            className={cs.tabs}
            tabs={TABS}
            value={this.state.currentTab}
            onChange={this.onTabChange}
          />
        )}
        {!loading && this.renderTab()}
      </div>
    );
  }
}

SampleDetailsMode.propTypes = {
  sampleId: PropTypes.number,
  pipelineVersion: PropTypes.string, // Needs to be string for 3.1 vs. 3.10.
  onMetadataUpdate: PropTypes.func,
  showReportLink: PropTypes.bool,
};

export default SampleDetailsMode;
