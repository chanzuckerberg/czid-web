import React from "react";
import PropTypes from "prop-types";
import DownloadButtonDropdown from "../../ui/controls/dropdowns/DownloadButtonDropdown";

class PhyloTreeDownloadButton extends React.Component {
  constructor(props) {
    super(props);

    this.allOptions = [
      { text: "VCF", value: "vcf" },
      { text: "SNP annotations", value: "snp_annotations" }
    ];
    this.download = this.download.bind(this);
  }

  download(option) {
    location.href = `/phylo_trees/${
      this.props.tree.id
    }/download?output=${option}`;
  }

  render() {
    let readyOptions = this.allOptions.filter(
      opt => !!this.props.tree[opt.value]
    );
    return (
      <DownloadButtonDropdown
        options={readyOptions}
        disabled={readyOptions.length === 0}
        onClick={this.download}
      />
    );
  }
}

PhyloTreeDownloadButton.propTypes = {
  tree: PropTypes.object
};

export default PhyloTreeDownloadButton;
