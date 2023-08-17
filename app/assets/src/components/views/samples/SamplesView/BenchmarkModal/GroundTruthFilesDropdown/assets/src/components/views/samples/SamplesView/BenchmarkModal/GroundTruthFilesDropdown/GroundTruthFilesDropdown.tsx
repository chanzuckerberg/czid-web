import { Dropdown, LoadingIndicator } from "@czi-sds/components";
import React, { useEffect, useState } from "react";
import { getBenchmarkGroundTruthFiles } from "~/api";
import cs from "./ground_truth_files_dropdown.scss";

interface GroundTruthFilesDropdownProps {
  onGroundTruthFileSelection: ({ groundTruthFileOption, s3BucketPath }) => void;
  selectedGroundTruthFileOption: { id: number; name: string };
}

export const GroundTruthFilesDropdown = ({
  onGroundTruthFileSelection,
  selectedGroundTruthFileOption,
}: GroundTruthFilesDropdownProps) => {
  const [files, setFiles] = useState<string[]>([]);
  const [s3BucketPath, setS3BucketPath] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchGroundTruthFiles = async () => {
      setLoading(true);
      const { groundTruthFileNames, groundTruthFilesS3Bucket } =
        await getBenchmarkGroundTruthFiles();

      setFiles(groundTruthFileNames);
      setS3BucketPath(groundTruthFilesS3Bucket);
      setLoading(false);
    };

    fetchGroundTruthFiles();
  }, []);

  const label =
    selectedGroundTruthFileOption?.name ?? "Select a truth file (optional)";
  return (
    <div className={cs.truthFiles}>
      <h3 className={cs.title}>Truth File:</h3>
      <Dropdown
        InputDropdownProps={{
          label,
          intent: "default",
          sdsStyle: "square",
          sdsType: "singleSelect",
        }}
        isTriggerChangeOnOptionClick
        label={label}
        search
        options={files.map((file, index) => ({
          id: index,
          name: file,
        }))}
        onChange={groundTruthFileOption => {
          if (groundTruthFileOption) {
            onGroundTruthFileSelection({
              groundTruthFileOption,
              s3BucketPath,
            });
          }
        }}
        value={selectedGroundTruthFileOption}
        DropdownMenuProps={{
          keepSearchOnSelect: true,
          loading: loading,
          loadingText: <LoadingIndicator sdsStyle="minimal" />,
          isOptionEqualToValue: (option: any, value: any) =>
            option.name === value.name,
        }}
      />
    </div>
  );
};
