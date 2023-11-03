import cx from "classnames";
import { head } from "lodash/fp";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import {
  NEXTCLADE_DEFAULT_TREE_LINK,
  NEXTCLADE_TREE_FORMAT_LINK,
  NEXTCLADE_TREE_ROOT_LINK,
} from "~/components/utils/documentationLinks";
import FilePicker from "~ui/controls/FilePicker";
import RadioButton from "~ui/controls/RadioButton";
import cs from "./nextclade_modal_tree_options.scss";

interface NextcladeReferenceTreeOptionsProps {
  referenceTree?: string;
  onChange: $TSFixMeFunction;
  onSelect: $TSFixMeFunction;
  selectedType?: string;
}

class NextcladeReferenceTreeOptions extends React.Component<NextcladeReferenceTreeOptionsProps> {
  onDrop = acceptedFile => {
    this.props.onChange(head(acceptedFile));
  };

  onRejected = () => {
    const msg =
      "Invalid file. Files must be in JSON format and file size must be under 5GB.";
    window.alert(msg);
  };

  getFilePickerTitle = () => {
    const { referenceTree } = this.props;

    return referenceTree ? `${referenceTree} Selected For Upload` : null;
  };

  render() {
    const filePickerTitle = this.getFilePickerTitle();
    const { onSelect, selectedType } = this.props;
    const uploadSelected = selectedType === "upload";

    return (
      <div className={cs.treeTypeContainer}>
        <div
          className={cx(cs.treeType, !uploadSelected && cs.selected)}
          onClick={() => onSelect("global")}
        >
          <RadioButton className={cs.radioButton} selected={!uploadSelected} />
          <div className={cs.content}>
            <div className={cs.name}>Nextclade Default Tree</div>
            <div className={cs.description}>
              This tree includes worldwide data from Nextstrain,{" "}
              <ExternalLink href={NEXTCLADE_DEFAULT_TREE_LINK}>
                view the tree.
              </ExternalLink>
            </div>
          </div>
        </div>
        <div
          className={cx(cs.treeType, uploadSelected && cs.selected)}
          onClick={() => onSelect("upload")}
        >
          <RadioButton className={cs.radioButton} selected={uploadSelected} />
          <div className={cs.content}>
            <div className={cs.name}>Upload a Tree</div>
            <div className={cs.description}>
              You can upload your own info in{" "}
              <ExternalLink href={NEXTCLADE_TREE_FORMAT_LINK}>
                Auspice JSON
              </ExternalLink>{" "}
              format. For compatibility, make sure your tree&apos;s root is{" "}
              <ExternalLink href={NEXTCLADE_TREE_ROOT_LINK}>
                Wuhan/Hu-1/2019.
              </ExternalLink>
            </div>
            {uploadSelected && (
              <div className={cs.fields}>
                <FilePicker
                  className={cx(
                    cs.localFilePicker,
                    !filePickerTitle && cs.short,
                  )}
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                  title={filePickerTitle}
                  accept=".json"
                  onChange={this.onDrop}
                  onRejected={this.onRejected}
                  multiFile={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default NextcladeReferenceTreeOptions;
