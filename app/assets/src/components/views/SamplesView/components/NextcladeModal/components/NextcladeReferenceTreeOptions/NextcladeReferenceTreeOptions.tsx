import { cx } from "@emotion/css";
import { head } from "lodash/fp";
import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import FilePicker from "~/components/ui/controls/FilePicker";
import RadioButton from "~/components/ui/controls/RadioButton";
import {
  NEXTCLADE_DEFAULT_TREE_LINK,
  NEXTCLADE_TREE_FORMAT_LINK,
  NEXTCLADE_TREE_ROOT_LINK,
} from "~/components/utils/documentationLinks";
import cs from "./nextclade_modal_tree_options.scss";

interface NextcladeReferenceTreeOptionsProps {
  referenceTree?: string | null;
  onChange: $TSFixMeFunction;
  onSelect: $TSFixMeFunction;
  selectedType?: string;
}

export const NextcladeReferenceTreeOptions = ({
  referenceTree,
  onChange,
  onSelect,
  selectedType,
}: NextcladeReferenceTreeOptionsProps) => {
  const onDrop = acceptedFile => {
    onChange(head(acceptedFile));
  };

  const onRejected = () => {
    const msg =
      "Invalid file. Files must be in JSON format and file size must be under 5GB.";
    window.alert(msg);
  };

  const filePickerTitle = referenceTree
    ? `${referenceTree} Selected For Upload`
    : undefined;
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
                className={cx(cs.localFilePicker, !filePickerTitle && cs.short)}
                title={filePickerTitle}
                accept=".json"
                onChange={onDrop}
                onRejected={onRejected}
                multiFile={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
