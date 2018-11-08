import React from "react";
import moment from "moment";
import { keyBy, mapValues, some } from "lodash";
import PropTypes from "~/components/utils/propTypes";
import Sidebar from "~/components/ui/containers/Sidebar";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import {
  getSampleMetadata,
  saveSampleMetadata,
  getMetadataTypes,
  saveSampleName
} from "~/api";
import MetadataEditor from "./MetadataEditor";
import ObjectHelper from "~/helpers/ObjectHelper";
import cs from "./sample_details_sidebar.scss";

// Transform the server metadata response to a simple key => value map.
const processMetadata = metadata => {
  let newMetadata = keyBy(metadata, "key");

  newMetadata = mapValues(
    newMetadata,
    val =>
      val.data_type === "string"
        ? val.text_validated_value
        : val.number_validated_value
  );

  return newMetadata;
};

const processMetadataTypes = metadataTypes => keyBy(metadataTypes, "key");

// Format the upload date.
const processAdditionalInfo = additionalInfo =>
  ObjectHelper.set(
    additionalInfo,
    "upload_date",
    moment(additionalInfo.upload_date).format("MM/DD/YYYY")
  );

class SampleDetailsSidebar extends React.Component {
  state = {
    metadata: null,
    additionalInfo: null,
    metadataTypes: null,
    metadataChanged: {},
    metadataSavePending: {}
  };

  async componentDidMount() {
    const [metadata, metadataTypes] = await Promise.all([
      getSampleMetadata(this.props.sample.id),
      getMetadataTypes()
    ]);
    this.setState({
      metadata: processMetadata(metadata.metadata),
      additionalInfo: processAdditionalInfo(metadata.additional_info),
      metadataTypes: processMetadataTypes(metadataTypes)
    });
  }

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  handleMetadataChange = (key, value, shouldSave) => {
    /* Sample name is a special case */
    if (key === "name") {
      this.setState({
        additionalInfo: ObjectHelper.set(
          this.state.additionalInfo,
          "name",
          value
        ),
        metadataChanged: ObjectHelper.set(
          this.state.metadataChanged,
          "name",
          true
        )
      });

      return;
    }

    this.setState({
      metadata: ObjectHelper.set(this.state.metadata, key, value),
      metadataChanged: ObjectHelper.set(
        this.state.metadataChanged,
        key,
        !shouldSave
      )
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
        metadataChanged: ObjectHelper.set(
          this.state.metadataChanged,
          key,
          false
        )
      });

      this._save(
        this.props.sample.id,
        key,
        key === "name"
          ? this.state.additionalInfo.name
          : this.state.metadata[key]
      );
    }
  };

  _save = async (id, key, value) => {
    this.setState({
      metadataSavePending: ObjectHelper.set(
        this.state.metadataSavePending,
        key,
        true
      )
    });

    if (key === "name") {
      await saveSampleName(id, value);
    } else {
      await saveSampleMetadata(this.props.sample.id, key, value);
    }

    this.setState({
      metadataSavePending: ObjectHelper.set(
        this.state.metadataSavePending,
        key,
        false
      )
    });
  };

  render() {
    const { visible } = this.props;
    const {
      metadata,
      metadataTypes,
      metadataSavePending,
      additionalInfo
    } = this.state;

    const savePending = some(metadataSavePending);
    return (
      <Sidebar visible={visible} width="very wide">
        <div className={cs.content}>
          <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
          {additionalInfo && (
            <div className={cs.title}>{additionalInfo.name}</div>
          )}
          {metadata === null ? (
            <div className={cs.loadingMsg}>Loading...</div>
          ) : (
            <MetadataEditor
              metadata={metadata}
              additionalInfo={additionalInfo}
              metadataTypes={metadataTypes}
              onMetadataChange={this.handleMetadataChange}
              onMetadataSave={this.handleMetadataSave}
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
