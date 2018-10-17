import React from "react";
import PropTypes from "prop-types";
import DownloadButtonDropdown from "../../ui/controls/dropdowns/DownloadButtonDropdown";

class PhyloTreeDownload extends React.Component {
  constructor(props) {
    super(props);

    this.tree = props.tree;
    this.allOptions = [
      { text: "Multiple alignment", value: "multiple_alignment" },
      { text: "SNP annotations", value: "snp_annotations" }
    ];
    this.readyOptions = this.allOptions.filter(opt => !!this.tree[opt.value]);
    this.download = this.download.bind(this);
  }

  download(option) {
    location.href = `/phylo_trees/${this.tree.id}/download?output=${option}`;
  }

  render() {
    return (
      <DownloadButtonDropdown
        options={this.readyOptions}
        disabled={this.readyOptions.length === 0}
        onClick={this.download}
      />
    );
  }
}

PhyloTreeDownload.propTypes = {
  tree: PropTypes.object
};

export default PhyloTreeDownload;
