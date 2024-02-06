import { Button, InputText } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { some } from "lodash/fp";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { SortDirection } from "react-virtualized";
import { getBulkDownloads, getPresignedOutputUrl } from "~/api/bulk_downloads";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import { Divider, NarrowContainer, ViewHeader } from "~/components/layout";
import ImgDownloadPrimary from "~/components/ui/illustrations/ImgDownloadPrimary";
import Label from "~/components/ui/labels/Label";
import { openUrl } from "~/components/utils/links";
import { Table } from "~/components/visualizations/table";
import { BulkDownloadDetails } from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import cs from "./bulk_download_list.scss";
import { getBulkDownloadTableColumns } from "./components/BulkDownloadTableRenderers/bulkDownloadTableColumns";

// The number of times we automatically update the bulk downloads on the page before prompting the user.
const AUTO_UPDATE_MAX_COUNT = 15;

// Slightly larger than PROGRESS_UPDATE_DELAY on the back-end.
const AUTO_UPDATE_DELAY = 20000;

const STATUS_TYPES = {
  waiting: "default",
  running: "default",
  success: "success",
  error: "error",
};

const STATUS_DISPLAY = {
  waiting: "in progress",
  running: "in progress",
  success: "complete",
  error: "failed",
};

// It is possible for a bulk download to "complete with issues".
// For example, a few of the source files could not be found, but the rest were compressed successfully.
// In this case, the bulk download task will have status = success and also have an error message.
const getStatusType = (bulkDownload: $TSFixMe) => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return "warning";
  }
  return STATUS_TYPES[bulkDownload.status];
};

const getStatusDisplay = (bulkDownload: $TSFixMe) => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return "complete with issue";
  }
  return STATUS_DISPLAY[bulkDownload.status];
};

const getTooltipText = (bulkDownload: $TSFixMe) => {
  if (bulkDownload.status === "success" && bulkDownload.error_message) {
    return bulkDownload.error_message;
  }

  return null;
};

const BulkDownloadList = () => {
  const [autoUpdateCount, setAutoUpdateCount] = useState(0);
  const [bulkDownloads, setBulkDownloads] = useState<
    BulkDownloadDetails[] | null
  >(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingAdminFields, setIsSettingAdminFields] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUrlParsed, setIsUrlParsed] = useState(false);
  const [selectedBulkDownload, setSelectedBulkDownload] =
    useState<BulkDownloadDetails | null>(null);
  const [searchBy, setSearchBy] = useState<string | null>(null);
  const [searchLimit, setSearchLimit] = useState<string | null>(null);

  const userContext = useContext(UserContext);
  const isAdmin = userContext.admin;

  const hasInProgressBulkDownloads = some(["status", "running"], bulkDownloads);

  useEffect(() => {
    setIsEmpty(!!(bulkDownloads && bulkDownloads.length === 0));
    setIsLoading(bulkDownloads === null);
  }, [bulkDownloads]);

  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      searchBy: params.get("searchBy"),
      searchLimit: params.get("n"),
    };
  };

  const handleDownloadFileClick = async (bulkDownload: $TSFixMe) => {
    // This should only be clickable when the bulk download has succeeded
    // TODO(mark): Handle error case.
    if (bulkDownload.status === "success") {
      const outputFilePresignedUrl = await getPresignedOutputUrl(
        bulkDownload.id,
      );
      openUrl(outputFilePresignedUrl);
    }
  };

  const handleStatusClick = (bulkDownload: BulkDownloadDetails) => {
    setSelectedBulkDownload(bulkDownload);
    setIsSidebarOpen(true);
  };

  const processBulkDownloads = useCallback(
    (bulkDownloadsRaw: $TSFixMe): BulkDownloadDetails[] | null =>
      bulkDownloadsRaw?.map((bulkDownloadRaw: $TSFixMe) => ({
        ...bulkDownloadRaw,
        // Add callback to be used in renderDownload table renderer.
        onStatusClick: () => {
          handleStatusClick(bulkDownloadRaw);
        },
        // Add callbacks to be used in renderStatus table renderer.
        onDownloadFileClick: () => {
          handleDownloadFileClick(bulkDownloadRaw);
        },
        statusType: getStatusType(bulkDownloadRaw),
        statusDisplay: getStatusDisplay(bulkDownloadRaw),
        tooltipText: getTooltipText(bulkDownloadRaw),
      })),
    [],
  );

  const autoUpdateBulkDownloads = useCallback(
    async (updateCount: number) => {
      if (!isUrlParsed || isSettingAdminFields) {
        return;
      }
      const bulkDownloadsRaw = await getBulkDownloads({
        searchBy: searchBy,
        n: searchLimit,
      });

      setBulkDownloads(processBulkDownloads(bulkDownloadsRaw));

      if (updateCount <= AUTO_UPDATE_MAX_COUNT && hasInProgressBulkDownloads) {
        setTimeout(
          () => autoUpdateBulkDownloads(updateCount + 1),
          AUTO_UPDATE_DELAY,
        );
      } else {
        setAutoUpdateCount(updateCount);
      }
    },
    [
      hasInProgressBulkDownloads,
      isSettingAdminFields,
      isUrlParsed,
      processBulkDownloads,
      searchBy,
      searchLimit,
    ],
  );

  useEffect(() => {
    const { searchBy, searchLimit } = getUrlParams();
    setSearchBy(searchBy);
    setSearchLimit(searchLimit);
    setIsUrlParsed(true);
  }, []);

  // State callbacks
  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleSearchByChange = event => {
    setIsSettingAdminFields(true);
    setSearchBy(event.target.value);
    if (event.target.value === "") {
      setIsSettingAdminFields(false);
    }
  };

  const handleSearchLimitChange = event => {
    setIsSettingAdminFields(true);
    setSearchLimit(event.target.value);
    if (event.target.value === "") {
      setIsSettingAdminFields(false);
    }
  };

  const handleSearchKeyDown = event => {
    if (event.key === "Enter") {
      window.location.href = `/bulk_downloads?searchBy=${searchBy}&n=${searchLimit}`;
    }
  };

  const initiateAutoUpdate = useCallback(() => {
    setAutoUpdateCount(0);
    autoUpdateBulkDownloads(0);
  }, [autoUpdateBulkDownloads]);

  useEffect(() => {
    initiateAutoUpdate();
  }, [initiateAutoUpdate]);

  return (
    <div
      className={cx(
        cs.bulkDownloadList,
        isEmpty && cs.empty,
        isLoading && cs.loading,
      )}
    >
      <NarrowContainer>
        <ViewHeader className={cs.viewHeader}>
          <ViewHeader.Content>
            <ViewHeader.Pretitle breadcrumbLink={"/home"}>
              Back
            </ViewHeader.Pretitle>
            <ViewHeader.Title label={"Downloads"} />
          </ViewHeader.Content>
          <ViewHeader.Controls>
            {isAdmin && (
              <>
                <Label text="Admin Settings" color="blue" size="mini" />
                <br />
                <small>Show downloads for:</small>
                <InputText
                  sdsType="textField"
                  size="small"
                  id="searchBy"
                  label="Show downloads for"
                  hideLabel
                  defaultValue={searchBy}
                  onChange={handleSearchByChange}
                  onKeyDown={handleSearchKeyDown}
                />
                <small>Downloads to show:</small>
                <InputText
                  sdsType="textField"
                  size="small"
                  id="n"
                  label="Downloads to show"
                  hideLabel
                  defaultValue={searchLimit}
                  onChange={handleSearchLimitChange}
                  onKeyDown={handleSearchKeyDown}
                />
              </>
            )}
          </ViewHeader.Controls>
        </ViewHeader>
      </NarrowContainer>
      <Divider />
      {isLoading && (
        <LoadingMessage
          className={cs.loadingMessage}
          message="Loading Downloads"
        />
      )}
      {!isLoading && isEmpty && (
        <div className={cs.blankScreenContainer}>
          <BlankScreenMessage
            message="You don't have any bulk downloads yet"
            tagline="You can select samples from your data and request a download."
            icon={<ImgDownloadPrimary className={cs.largeDownloadIcon} />}
            textWidth={260}
          />
        </div>
      )}
      {!isLoading && !isEmpty && (
        <NarrowContainer className={cs.tableContainer}>
          {autoUpdateCount >= AUTO_UPDATE_MAX_COUNT &&
            hasInProgressBulkDownloads && (
              <Notification
                type="warning"
                displayStyle="flat"
                className={cs.autoUpdateWarning}
              >
                This page is no longer auto-updating.{" "}
                <Button
                  sdsType="secondary"
                  sdsStyle="minimal"
                  isAllCaps={false}
                  onClick={initiateAutoUpdate}
                  className={cs.link}
                >
                  Click here to see additional updates.
                </Button>
              </Notification>
            )}
          {bulkDownloads && (
            <Table
              rowClassName={cs.tableRow}
              headerClassName={cs.tableHeader}
              className={cs.table}
              columns={getBulkDownloadTableColumns({ isAdmin })}
              data={bulkDownloads}
              defaultRowHeight={70}
              sortable
              defaultSortBy="created_at"
              defaultSortDirection={SortDirection.DESC}
            />
          )}
        </NarrowContainer>
      )}

      <DetailsSidebar
        visible={isSidebarOpen}
        mode="bulkDownloadDetails"
        onClose={handleSidebarClose}
        params={{
          bulkDownloadId: selectedBulkDownload?.id,
        }}
      />
    </div>
  );
};

export default BulkDownloadList;
