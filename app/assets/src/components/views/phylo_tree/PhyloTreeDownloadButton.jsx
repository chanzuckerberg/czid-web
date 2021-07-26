import PropTypes from "prop-types";
import React from "react";
import SvgSaver from "svgsaver";

import { logAnalyticsEvent } from "~/api/analytics";

import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import DownloadButtonDropdown from "../../ui/controls/dropdowns/DownloadButtonDropdown";

class PhyloTreeDownloadButton extends React.Component {
  constructor(props) {
    super(props);

    this.dataOptions = [
      { text: "VCF", value: "vcf" },
      { text: "SNP annotations", value: "snp_annotations" },
    ];
    this.treeOptions = [
      { text: "Tree File (.nwk)", value: "phylotree.phylotree_newick" },
      { text: "Tree Image (.svg)", value: "svg" },
      { text: "Tree Image (.png)", value: "png" },
    ];
    this.heatmapImageOptions = [
      { text: "Heatmap Image (.svg)", value: "phylotree.clustermap_svg" },
      { text: "Heatmap Image (.png)", value: "phylotree.clustermap_png" },
    ];
    this.skaOptions = [
      { text: "SKA Distances (.tsv)", value: "phylotree.ska_distances" },
      { text: "SKA Variants (.aln)", value: "phylotree.variants" },
    ];
    this.phyloTreeNgOptions = [
      "phylotree.phylotree_newick",
      "phylotree.clustermap_svg",
      "phylotree.clustermap_png",
      "phylotree.ska_distances",
      "phylotree.variants",
    ];
    this.download = this.download.bind(this);
    this.svgSaver = new SvgSaver();
  }

  download(option) {
    const { tree, treeContainer } = this.props;

    if (this.dataOptions.map(o => o.value).includes(option)) {
      location.href = `/phylo_trees/${tree.id}/download?output=${option}`;
    } else if (this.phyloTreeNgOptions.includes(option)) {
      location.href = `/phylo_tree_ngs/${tree.id}/download?output=${option}`;
    } else if (option === "svg") {
      // TODO (gdingle): filename per tree?
      // Uses first <svg> found in treeContainer.
      this.svgSaver.asSvg(treeContainer, "phylo_tree.svg");
    } else if (option === "png") {
      // TODO (gdingle): filename per tree?
      // Uses first <svg> found in treeContainer.
      this.svgSaver.asPng(treeContainer, "phylo_tree.png");
    } else {
      // eslint-disable-next-line no-console
      console.error(`Bad download option: ${option}`);
    }
    logAnalyticsEvent("PhyloTreeDownloadButton_option_clicked", {
      option,
      treeName: this.props.tree.name,
      treeId: this.props.tree.id,
    });
  }

  render() {
    const {
      showPhyloTreeNgOptions,
      tree,
      treeContainer,
      ...props
    } = this.props;
    let readyOptions = this.dataOptions.filter(opt => !!tree[opt.value]);

    // Don't include the newick file unless it's a phyloTreeNg.
    readyOptions = readyOptions.concat(
      this.treeOptions.filter(
        opt =>
          !this.phyloTreeNgOptions.includes(opt.value) || showPhyloTreeNgOptions
      )
    );

    if (showPhyloTreeNgOptions) {
      // Convert the options to BareDropdown Items and add the Divider.
      readyOptions = readyOptions.concat(this.heatmapImageOptions);

      let dropdownItems = readyOptions.map(option => {
        return (
          <BareDropdown.Item
            key={option.value}
            onClick={() => this.download(option.value)}
            text={option.text}
          />
        );
      });
      dropdownItems.push(<BareDropdown.Divider key="divider_one" />);
      dropdownItems = dropdownItems.concat(
        this.skaOptions.map(option => {
          return (
            <BareDropdown.Item
              key={option.value}
              onClick={() => this.download(option.value)}
              text={option.text}
            />
          );
        })
      );

      return (
        <DownloadButtonDropdown
          items={dropdownItems}
          disabled={dropdownItems.length === 0}
          {...props}
        />
      );
    }

    return (
      <DownloadButtonDropdown
        options={readyOptions}
        disabled={readyOptions.length === 0}
        onClick={this.download}
        {...props}
      />
    );
  }
}

PhyloTreeDownloadButton.propTypes = {
  showPhyloTreeNgOptions: PropTypes.bool,
  tree: PropTypes.object,
  treeContainer: PropTypes.instanceOf(Element),
};

export default PhyloTreeDownloadButton;
