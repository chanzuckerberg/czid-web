import React from "react";
import { some } from "lodash";
import { set } from "lodash/fp";
import PropTypes from "~/components/utils/propTypes";
import Sidebar from "~/components/ui/containers/Sidebar";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import Tabs from "~/components/ui/controls/Tabs";
import {
  getSampleMetadata,
  saveSampleMetadata,
  getMetadataTypes,
  saveSampleName,
  saveSampleNotes
} from "~/api";
import MetadataTab from "./MetadataTab";
import PipelineTab from "./PipelineTab";
import NotesTab from "./NotesTab";
import { processMetadata, processMetadataTypes } from "~utils/metadata";
import { processPipelineInfo, processAdditionalInfo } from "./info_utils";
import cs from "./sample_details_sidebar.scss";

const TABS = ["Metadata", "Pipeline", "Notes"];

class SampleDetailsSidebar extends React.Component {
  state = {
    metadata: null,
    additionalInfo: null,
    pipelineInfo: null,
    metadataTypes: null,
    metadataChanged: {},
    metadataSavePending: {},
    currentTab: TABS[0]
  };

  onTabChange = tab => {
    this.setState({ currentTab: tab });
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
    this.setState({
      metadata: null,
      additionalInfo: null,
      pipelineInfo: null
    });

    if (!this.props.sampleId) {
      return;
    }

    // Metadata Types currently doesn't change, so only need to fetch it once.
    let metadata = null;
    let metadataTypes = null;
    if (this.state.metadataTypes) {
      metadata = await getSampleMetadata(this.props.sampleId);
    } else {
      [metadata, metadataTypes] = await Promise.all([
        getSampleMetadata(this.props.sampleId),
        getMetadataTypes()
      ]);
    }

    this.setState({
      metadata: processMetadata(metadata.metadata),
      additionalInfo: processAdditionalInfo(metadata.additional_info),
      pipelineInfo: processPipelineInfo(metadata.additional_info),
      pipelineRun: metadata.additional_info.pipeline_run,
      metadataTypes: metadataTypes
        ? processMetadataTypes(metadataTypes)
        : this.state.metadataTypes
    });
  };

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  handleMetadataChange = (key, value, shouldSave) => {
    /* Sample name and note are special cases */
    if (key === "name" || key === "notes") {
      this.setState({
        additionalInfo: set(key, value, this.state.additionalInfo),
        metadataChanged: set(key, true, this.state.metadataChanged)
      });

      return;
    }

    this.setState({
      metadata: set(key, value, this.state.metadata),
      metadataChanged: set(key, !shouldSave, this.state.metadataChanged)
    });

    if (shouldSave) {
      this._save(this.props.sampleId, key, value);
    }
  };

  handleMetadataSave = async key => {
    if (this.state.metadataChanged[key]) {
      const newValue =
        key === "name" || key === "notes"
          ? this.state.additionalInfo[key]
          : this.state.metadata[key];

      this.setState({
        metadataChanged: set(key, false, this.state.metadataChanged)
      });

      this._save(this.props.sampleId, key, newValue);
    }
  };

  _save = async (id, key, value) => {
    // When metadata is saved, fire event.
    if (this.props.onMetadataUpdate) {
      this.props.onMetadataUpdate(key, value);
    }

    this.setState({
      metadataSavePending: set(key, true, this.state.metadataSavePending)
    });

    if (key === "name") {
      await saveSampleName(id, value);
    } else if (key === "notes") {
      await saveSampleNotes(id, value);
    } else {
      await saveSampleMetadata(this.props.sampleId, key, value);
    }

    this.setState({
      metadataSavePending: set(key, false, this.state.metadataSavePending)
    });
  };

  renderTab = () => {
    const {
      metadata,
      metadataTypes,
      metadataSavePending,
      additionalInfo,
      pipelineInfo,
      pipelineRun
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
    const { visible, showReportLink, sampleId } = this.props;
    const { metadata, metadataTypes, additionalInfo } = this.state;

    const loading = !metadata || !metadataTypes;

    return (
      <Sidebar visible={visible} width="very wide">
        <div className={cs.content}>
          <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
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
      </Sidebar>
    );
  }
}

SampleDetailsSidebar.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  sampleId: PropTypes.number,
  onMetadataUpdate: PropTypes.func,
  showReportLink: PropTypes.bool
};

export default SampleDetailsSidebar;
