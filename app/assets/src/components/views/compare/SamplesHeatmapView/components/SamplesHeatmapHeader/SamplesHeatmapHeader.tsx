import { ButtonIcon, Icon } from "@czi-sds/components";
import React, { useContext } from "react";
import { Popup } from "semantic-ui-react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { updateHeatmapName } from "~/api/visualization";
import BasicPopup from "~/components/BasicPopup";
import { UserContext } from "~/components/common/UserContext";
import { ViewHeader } from "~/components/layout";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import EditableInput from "~/components/ui/controls/EditableInput";
import {
  SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
  showAppcue,
} from "~/components/utils/appcues";
import {
  replaceSpecialCharacters,
  testForSpecialCharacters,
} from "~/helpers/strings";
import {
  DownloadButton,
  HelpButton,
  PrimaryButton,
  SaveButton,
  ShareButton,
} from "~ui/controls/buttons";
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
}: SamplesHeatmapHeaderProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};

  const handleHeatmapRename = async (name: string) => {
    if (name === "heatmap") return "";
    let error = "";

    name = replaceSpecialCharacters(name);

    try {
      await updateHeatmapName(heatmapId, name);
      trackEvent(ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_NAME_RENAMED, {
        id: heatmapId,
        heatmapName: name,
      });
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
                  onClick={withAnalytics(
                    onNewPresetsClick,
                    ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_NEW_PRESETS_BUTTON_CLICKED,
                  )}
                />
              }
              content="Create a new heatmap for the same sample set."
            />
          )}
          <BasicPopup
            trigger={
              <ShareButton
                className={cs.controlElement}
                onClick={withAnalytics(
                  onShareClick,
                  ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_SHARE_BUTTON_CLICKED,
                  {
                    sampleIds: sampleIds.length,
                  },
                )}
                primary={!showNewPresetsButton}
              />
            }
            content="A shareable URL was copied to your clipboard!"
            on="click"
            hideOnScroll
          />
          <SaveButton
            onClick={withAnalytics(
              onSaveClick,
              ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_SAVE_BUTTON_CLICKED,
              {
                sampleIds: sampleIds.length,
                path: window.location.pathname,
              },
            )}
            className={cs.controlElement}
          />
          <DownloadButton
            className={cs.controlElement}
            onClick={onDownloadClick}
            disabled={loading}
          />
          <HelpButton
            className={cs.controlElement}
            onClick={showAppcue({
              flowId: SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
              analyticEventName:
                ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_HEADER_HELP_BUTTON_CLICKED,
            })}
          />
        </ViewHeader.Controls>{" "}
      </ViewHeader>
    </>
  );
};
