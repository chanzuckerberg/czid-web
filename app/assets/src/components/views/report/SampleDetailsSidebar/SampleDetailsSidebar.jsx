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
import {
  processMetadata,
  processMetadataTypes,
  processPipelineInfo,
  processAdditionalInfo
} from "./utils";
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

  async componentDidMount() {
    const [metadata, metadataTypes] = await Promise.all([
      getSampleMetadata(this.props.sample.id),
      getMetadataTypes()
    ]);
    this.setState({
      metadata: processMetadata(metadata.metadata),
      additionalInfo: processAdditionalInfo(metadata.additional_info),
      pipelineInfo: processPipelineInfo(metadata.additional_info),
      pipelineRun: metadata.additional_info.pipeline_run,
      metadataTypes: processMetadataTypes(metadataTypes)
    });
  }

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
      this._save(this.props.sample.id, key, value);
    }
  };

  handleMetadataSave = async key => {
    if (this.state.metadataChanged[key]) {
      // Updating the name is pretty slow, so only do it on save, instead of on change.
      if (key === "name") {
        if (this.props.onNameUpdate) {
          this.props.onNameUpdate(this.state.additionalInfo.name);
        }
      }

      this.setState({
        metadataChanged: set(key, false, this.state.metadataChanged)
      });

      this._save(
        this.props.sample.id,
        key,
        key === "name" || key === "notes"
          ? this.state.additionalInfo[key]
          : this.state.metadata[key]
      );
    }
  };

  _save = async (id, key, value) => {
    this.setState({
      metadataSavePending: set(key, true, this.state.metadataSavePending)
    });

    if (key === "name") {
      await saveSampleName(id, value);
    } else if (key === "notes") {
      await saveSampleNotes(id, value);
    } else {
      await saveSampleMetadata(this.props.sample.id, key, value);
    }

    this.setState({
      metadataSavePending: set(key, false, this.state.metadataSavePending)
    });
  };

  render() {
    const { visible } = this.props;
    const {
      metadata,
      metadataTypes,
      metadataSavePending,
      additionalInfo,
      pipelineInfo,
      pipelineRun
    } = this.state;

    const savePending = some(metadataSavePending);
    return (
      <Sidebar visible={visible} width="very wide">
        <div className={cs.content}>
          <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
          {additionalInfo && (
            <div className={cs.title}>{additionalInfo.name}</div>
          )}
          <Tabs
            className={cs.tabs}
            tabs={TABS}
            value={this.state.currentTab}
            onChange={this.onTabChange}
          />
          {this.state.currentTab === "Metadata" && (
            <MetadataTab
              metadata={metadata}
              additionalInfo={additionalInfo}
              metadataTypes={metadataTypes}
              onMetadataChange={this.handleMetadataChange}
              onMetadataSave={this.handleMetadataSave}
              savePending={savePending}
            />
          )}
          {this.state.currentTab === "Pipeline" && (
            <PipelineTab
              pipelineInfo={pipelineInfo}
              erccComparison={additionalInfo.ercc_comparison}
              pipelineRun={pipelineRun}
              assembledTaxIds={additionalInfo.assembled_taxids}
              sampleId={this.props.sample.id}
            />
          )}
          {this.state.currentTab === "Notes" && (
            <NotesTab
              notes={additionalInfo.notes}
              onNoteChange={val => this.handleMetadataChange("notes", val)}
              onNoteSave={() => this.handleMetadataSave("notes")}
              savePending={savePending}
            />
          )}
        </div>
      </Sidebar>
    );
  }
}

SampleDetailsSidebar.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  sample: PropTypes.Sample.isRequired,
  onNameUpdate: PropTypes.func
};

export default SampleDetailsSidebar;
