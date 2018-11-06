import React from "react";
import { keyBy, mapValues } from "lodash";
import PropTypes from "~/components/utils/propTypes";
import Sidebar from "~/components/ui/containers/Sidebar";
import RemoveIcon from "~/components/ui/icons/RemoveIcon";
import { getSampleMetadata, saveSampleMetadata, getMetadataTypes } from "~/api";
import MetadataEditor from "./MetadataEditor";
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

class SampleDetailsSidebar extends React.Component {
  state = {
    metadata: null,
    metadataTypes: null,
    metadataChanged: {}
  };

  async componentDidMount() {
    const [metadata, metadataTypes] = await Promise.all([
      getSampleMetadata(this.props.sample.id),
      getMetadataTypes()
    ]);
    this.setState({
      metadata: processMetadata(metadata),
      metadataTypes
    });
  }

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  onMetadataChange = (key, value, shouldSave) => {
    this.setState({
      metadata: {
        ...this.state.metadata,
        [key]: value
      },
      metadataChanged: {
        ...this.state.metadataChanged,
        [key]: !shouldSave
      }
    });

    if (shouldSave) {
      saveSampleMetadata(this.props.sample.id, key, value);
    }
  };

  onMetadataSave = key => {
    if (this.state.metadataChanged[key]) {
      saveSampleMetadata(this.props.sample.id, key, this.state.metadata[key]);

      this.setState({
        metadataChanged: {
          ...this.state.metadataChanged,
          [key]: false
        }
      });
    }
  };

  render() {
    const { visible } = this.props;
    const { metadata, metadataTypes } = this.state;

    return (
      <Sidebar visible={visible} width="very wide">
        <div className={cs.content}>
          <RemoveIcon className={cs.closeIcon} onClick={this.props.onClose} />
          <div className={cs.title}>Sample Details</div>
          {metadata === null ? (
            <div className={cs.loadingMsg}>Loading...</div>
          ) : (
            <MetadataEditor
              metadata={metadata}
              metadataTypes={metadataTypes}
              onMetadataChange={this.onMetadataChange}
              onMetadataSave={this.onMetadataSave}
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
  sample: PropTypes.Sample.isRequired
};

export default SampleDetailsSidebar;
