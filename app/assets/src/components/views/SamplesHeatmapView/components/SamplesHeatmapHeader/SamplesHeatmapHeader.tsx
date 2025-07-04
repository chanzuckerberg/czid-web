import { ButtonIcon, Icon } from "@czi-sds/components";
import React, { useContext } from "react";
import { Popup } from "semantic-ui-react";
import { updateHeatmapName } from "~/api/visualization";
import BasicPopup from "~/components/common/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import { ViewHeader } from "~/components/layout";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import EditableInput from "~/components/ui/controls/EditableInput";
import {
  replaceSpecialCharacters,
  testForSpecialCharacters,
} from "~/helpers/strings";
import {
  DownloadButton,
  PrimaryButton,
  SaveButton,
  ShareButton,
} from "~ui/controls/buttons";
import SamplesHeatmapLegend from "../SamplesHeatmapLegend";
import cs from "./samples_heatmap_header.scss";

interface SamplesHeatmapHeaderProps {
  sampleIds?: number[];
  loading?: boolean;
  heatmapId?: string | number;
  heatmapName?: string;
  presets?: $TSFixMeUnknown[];
  onDownloadClick?: $TSFixMeFunction;
  onNewPresetsClick?: $TSFixMeFunction;
  onShareClick: $TSFixMeFunction;
  onSaveClick: $TSFixMeFunction;
  onFilterToggleClick: $TSFixMeFunction;
  filterPanelOpen: boolean;
  data: $TSFixMeUnknown;
  selectedOptions: $TSFixMeUnknown;
  options: $TSFixMeUnknown;
}

export const SamplesHeatmapHeader = ({
  sampleIds,
  loading,
  heatmapId,
  heatmapName,
  presets,
  onDownloadClick,
  onNewPresetsClick,
  onShareClick,
  onSaveClick,
  onFilterToggleClick,
  filterPanelOpen,
  data,
  selectedOptions,
  options,
}: SamplesHeatmapHeaderProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const handleHeatmapRename = async (name: string) => {
    if (name === "heatmap") return "";
    let error = "";

    name = replaceSpecialCharacters(name);

    try {
      await updateHeatmapName(heatmapId, name);
    } catch (e) {
      error = "There was an error renaming your heatmap";
    }
    return [error, name] as [string, string];
  };

  const getWarningMessage = (inputText: string) => {
    return testForSpecialCharacters(inputText)
      ? 'The special character(s) you entered will be converted to "-"'
      : "";
  };

  const showNewPresetsButton =
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    allowedFeatures.includes("taxon_heatmap_presets") && !!presets.length;

  return (
    <>
      <ViewHeader className={cs.viewHeader}>
        <ViewHeader.Content>
          <div className={cs.contentContainer}>
            <div className={cs.contentColumn}>
              {/* First column */}
              <div className={cs.contentSpacer} />
              <Popup
                content={filterPanelOpen ? "Close Controls" : "Open Controls"}
                position="bottom right"
                inverted
                trigger={
                  <ButtonIcon
                    onClick={onFilterToggleClick}
                    sdsIcon="slidersHorizontal"
                    sdsSize="large"
                    sdsType="primary"
                    sx={{ marginRight: "10px" }}
                    on={filterPanelOpen}
                  />
                }
              />
            </div>

            <div className={cs.contentColumn}>
              {/* Second column */}
              <ViewHeader.Pretitle>
                <>Comparing {sampleIds ? sampleIds.length : ""} Samples</>
              </ViewHeader.Pretitle>
              <ViewHeader.Title
                // @ts-expect-error Type 'Element' is not assignable to type 'string'.
                label={
                  heatmapId ? (
                    <EditableInput
                      value={heatmapName || "Heatmap"}
                      className={cs.name}
                      onDoneEditing={handleHeatmapRename}
                      getWarningMessage={getWarningMessage}
                    />
                  ) : (
                    <>Heatmap</>
                  )
                }
              />
            </div>
          </div>
        </ViewHeader.Content>
        <ViewHeader.Controls className={cs.controls}>
          <SamplesHeatmapLegend
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            loading={loading}
            data={data}
            selectedOptions={selectedOptions}
            options={options}
          />
          {showNewPresetsButton && (
            <ColumnHeaderTooltip
              trigger={
                <PrimaryButton
                  text="New Presets"
                  icon={
                    <Icon
                      sdsIcon="slidersHorizontal"
                      sdsSize="l"
                      sdsType="static"
                    />
                  }
                  onClick={onNewPresetsClick}
                />
              }
              content="Create a new heatmap for the same sample set."
            />
          )}
          <BasicPopup
            trigger={
              <ShareButton
                className={cs.controlElement}
                onClick={onShareClick}
                primary={!showNewPresetsButton}
              />
            }
            content="A shareable URL was copied to your clipboard!"
            on="click"
            hideOnScroll
          />
          <SaveButton onClick={onSaveClick} className={cs.controlElement} />
          <DownloadButton
            className={cs.controlElement}
            onClick={onDownloadClick}
            disabled={loading}
          />
        </ViewHeader.Controls>{" "}
      </ViewHeader>
    </>
  );
};
