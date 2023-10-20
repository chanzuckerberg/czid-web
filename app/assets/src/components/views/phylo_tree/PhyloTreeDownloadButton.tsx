import React from "react";
import SvgSaver from "svgsaver";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import DownloadButtonDropdown from "../../ui/controls/dropdowns/DownloadButtonDropdown";

// Options Constants
const PHYLOTREE_CLUSTERMAP_SVG = "phylotree.clustermap_svg";
const PHYLOTREE_CLUSTERMAP_PNG = "phylotree.clustermap_png";
const PHYLOTREE_SKA_DISTANCES = "phylotree.ska_distances";

interface PhyloTreeDownloadButtonProps {
  showPhyloTreeNgOptions?: boolean;
  tree?: { clustermap_svg_url: string };
  treeContainer?: Element;
}

class PhyloTreeDownloadButton extends React.Component<PhyloTreeDownloadButtonProps> {
  dataOptions: $TSFixMe;
  matrixImageOptions: $TSFixMe;
  matrixOnlyOptions: $TSFixMe;
  phyloTreeNgOptions: $TSFixMe;
  skaOptions: $TSFixMe;
  svgSaver: $TSFixMe;
  treeOptions: $TSFixMe;
  constructor(props: PhyloTreeDownloadButtonProps) {
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
    this.matrixImageOptions = [
      { text: "Matrix Image (.svg)", value: PHYLOTREE_CLUSTERMAP_SVG },
      { text: "Matrix Image (.png)", value: PHYLOTREE_CLUSTERMAP_PNG },
    ];
    this.skaOptions = [
      { text: "SKA Distances (.tsv)", value: PHYLOTREE_SKA_DISTANCES },
      { text: "SKA Variants (.aln)", value: "phylotree.variants" },
    ];
    this.phyloTreeNgOptions = [
      "phylotree.phylotree_newick",
      PHYLOTREE_CLUSTERMAP_SVG,
      PHYLOTREE_CLUSTERMAP_PNG,
      PHYLOTREE_SKA_DISTANCES,
      "phylotree.variants",
    ];
    this.matrixOnlyOptions = [
      PHYLOTREE_CLUSTERMAP_SVG,
      PHYLOTREE_CLUSTERMAP_PNG,
      PHYLOTREE_SKA_DISTANCES,
    ];
    this.download = this.download.bind(this);
    this.svgSaver = new SvgSaver();
  }

  download(option: $TSFixMe) {
    const { tree, treeContainer } = this.props;

    if (this.dataOptions.map((o: $TSFixMe) => o.value).includes(option)) {
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      location.href = `/phylo_trees/${tree.id}/download?output=${option}`;
    } else if (this.phyloTreeNgOptions.includes(option)) {
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
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
  }

  getPhyloTreeOptions = () => {
    const { tree } = this.props;
    let readyOptions = this.dataOptions.filter(
      (opt: $TSFixMe) => !!tree[opt.value],
    );

    // Don't include the newick file unless it's a phyloTreeNg.
    readyOptions = readyOptions.concat(
      this.treeOptions.filter(
        (opt: $TSFixMe) => !this.phyloTreeNgOptions.includes(opt.value),
      ),
    );
    return readyOptions;
  };

  getPhyloTreeNgItems = () => {
    const readyOptions = this.treeOptions.concat(this.matrixImageOptions);

    // Convert the options to BareDropdown Items and add the Divider.
    let dropdownItems = readyOptions.map((option: $TSFixMe) => {
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
      this.skaOptions.map((option: $TSFixMe) => {
        return (
          <BareDropdown.Item
            key={option.value}
            onClick={() => this.download(option.value)}
            text={option.text}
          />
        );
      }),
    );
    return dropdownItems;
  };

  getMatrixItems = () => {
    let dropdownItems = this.matrixImageOptions.map((option: $TSFixMe) => {
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
      this.skaOptions.map((option: $TSFixMe) => {
        if (this.matrixOnlyOptions.includes(option.value)) {
          return (
            <BareDropdown.Item
              key={option.value}
              onClick={() => this.download(option.value)}
              text={option.text}
            />
          );
        }
      }),
    );
    return dropdownItems;
  };

  render() {
    const {
      showPhyloTreeNgOptions,
      tree,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      treeContainer,
      ...props
    } = this.props;

    if (showPhyloTreeNgOptions) {
      const downloadItems = tree.clustermap_svg_url
        ? this.getMatrixItems()
        : this.getPhyloTreeNgItems();
      return (
        <DownloadButtonDropdown
          items={downloadItems}
          disabled={downloadItems.length === 0}
          // this is broken, but alldoami found it while working on something unrelated
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
          {...props}
        />
      );
    }

    return (
      <DownloadButtonDropdown
        options={this.getPhyloTreeOptions()}
        disabled={this.getPhyloTreeOptions().length === 0}
        onClick={this.download}
        {...props}
      />
    );
  }
}

export default PhyloTreeDownloadButton;
