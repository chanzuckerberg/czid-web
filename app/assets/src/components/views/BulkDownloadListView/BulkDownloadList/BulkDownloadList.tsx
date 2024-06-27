import { Button } from "@czi-sds/components";
import { cx } from "@emotion/css";
import { some } from "lodash/fp";
import React, {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLazyLoadQuery, useRelayEnvironment } from "react-relay";
import { SortDirection } from "react-virtualized";
import { fetchQuery, graphql } from "relay-runtime";
import BlankScreenMessage from "~/components/common/BlankScreenMessage";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import LoadingMessage from "~/components/common/LoadingMessage";
import { UserContext } from "~/components/common/UserContext";
import { Divider, NarrowContainer, ViewHeader } from "~/components/layout";
import ImgDownloadPrimary from "~/components/ui/illustrations/ImgDownloadPrimary";
import { Table } from "~/components/visualizations/table";
import { BulkDownloadDetails } from "~/interface/shared";
import Notification from "~ui/notifications/Notification";
import {
  AUTO_UPDATE_DELAY,
  AUTO_UPDATE_MAX_COUNT,
  getStatusDisplay,
  getStatusType,
  getTooltipText,
  InProgressStatus,
} from "../constants";
import cs from "./bulk_download_list.scss";
import { getBulkDownloadTableColumns } from "./components/BulkDownloadTableRenderers/bulkDownloadTableColumns";
import { BulkDownloadListQuery as BulkDownloadDetailsQueryType } from "./__generated__/BulkDownloadListQuery.graphql";

const BulkDownloadListQuery = graphql`
  query BulkDownloadListQuery {
    fedBulkDownloads {
      ...BulkDownloadDetailsModeFragment
      ...DetailsTabFragment
      ...AdvancedDownloadTabFragment
      id
      status
      startedAt
      ownerUserId
      downloadType
      analysisCount
      url
      fileSize
      entityInputFileType
      entityInputs {
        id
      }
    }
  }
`;

const BulkDownloadListComponent = () => {
  const [autoUpdateCount, setAutoUpdateCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBulkDownload, setSelectedBulkDownload] =
    useState<BulkDownloadDetails | null>(null);
  const [refreshedQueryOptions, setRefreshedQueryOptions] = useState<{
    fetchKey?: number;
    fetchPolicy?: "store-only";
  }>({});

  const userContext = useContext(UserContext);
  const isAdmin = userContext.admin;

  // Relay Query
  const data = useLazyLoadQuery<BulkDownloadDetailsQueryType>(
    BulkDownloadListQuery,
    {},
    refreshedQueryOptions,
  );
  const bulkDownloadsData = data?.fedBulkDownloads;
  const hasInProgressBulkDownloads = useCallback(bulkDownloads => {
    return some(
      bulkDownload => InProgressStatus.includes(bulkDownload?.status),
      bulkDownloads,
    );
  }, []);
  const shouldBeAutoUpdating = hasInProgressBulkDownloads(bulkDownloadsData);

  useEffect(() => {
    setIsEmpty(!!(bulkDownloadsData && bulkDownloadsData.length === 0));
  }, [bulkDownloadsData]);

  const environment = useRelayEnvironment();
  const refresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    fetchQuery(environment, BulkDownloadListQuery, {}).subscribe({
      complete: () => {
        setIsRefreshing(false);
        setRefreshedQueryOptions(prev => ({
          fetchKey: (prev?.fetchKey ?? 0) + 1,
          fetchPolicy: "store-only",
        }));
      },
      error: () => {
        setIsRefreshing(false);
      },
    });
  }, [environment, isRefreshing]);

  useEffect(() => {
    const autoUpdate = (count: number) => {
      if (shouldBeAutoUpdating) {
        refresh();
        setAutoUpdateCount(count + 1);
      }
    };
    if (shouldBeAutoUpdating && autoUpdateCount <= AUTO_UPDATE_MAX_COUNT) {
      setTimeout(() => autoUpdate(autoUpdateCount), AUTO_UPDATE_DELAY);
    }
  }, [shouldBeAutoUpdating, autoUpdateCount, refresh]);

  const initiateAutoUpdate = () => setAutoUpdateCount(0);

  // State callbacks
  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleDetailsClick = (bulkDownload: BulkDownloadDetails) => {
    setSelectedBulkDownload(bulkDownload);
    setIsSidebarOpen(true);
  };

  // Formatting Util
  const processBulkDownloads = useCallback(
    (bulkDownloadsRaw): BulkDownloadDetails[] | undefined =>
      bulkDownloadsRaw?.map(bulkDownloadRaw => {
        return {
          ...bulkDownloadRaw,
          onDetailsClick: () => {
            handleDetailsClick(bulkDownloadRaw);
          },
          startedAt: new Date(bulkDownloadRaw?.startedAt).toISOString(),
          statusType: getStatusType(bulkDownloadRaw),
          statusDisplay: getStatusDisplay(
            bulkDownloadRaw?.status,
            bulkDownloadRaw?.errorMessage,
          ),
          tooltipText: getTooltipText(bulkDownloadRaw),
        };
      }),
    [],
  );

  return (
    <>
      {isEmpty && (
        <div className={cs.blankScreenContainer}>
          <BlankScreenMessage
            message="You don't have any bulk downloads right now."
            tagline="You can select samples from your data and request a download."
            icon={<ImgDownloadPrimary className={cs.largeDownloadIcon} />}
            textWidth={260}
          />
        </div>
      )}
      {!isEmpty && (
        <NarrowContainer className={cs.tableContainer}>
          {autoUpdateCount >= AUTO_UPDATE_MAX_COUNT &&
            hasInProgressBulkDownloads(bulkDownloadsData) && (
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
          {bulkDownloadsData && (
            <Table
              rowClassName={cs.tableRow}
              headerClassName={cs.tableHeader}
              className={cs.table}
              columns={getBulkDownloadTableColumns({ isAdmin })}
              data={processBulkDownloads(bulkDownloadsData)}
              defaultRowHeight={70}
              sortable
              defaultSortBy="startedAt"
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
          bulkDownloadData: bulkDownloadsData,
        }}
      />
    </>
  );
};

export const BulkDownloadList = () => {
  return (
    <div className={cx(cs.bulkDownloadList)}>
      <NarrowContainer>
        <ViewHeader className={cs.viewHeader}>
          <ViewHeader.Content>
            <ViewHeader.Pretitle breadcrumbLink={"/home"}>
              Back
            </ViewHeader.Pretitle>
            <ViewHeader.Title label={"Downloads"} />
          </ViewHeader.Content>
        </ViewHeader>
      </NarrowContainer>
      <Divider />
      <Suspense
        fallback={
          <LoadingMessage
            className={cs.loadingMessage}
            message="Loading Downloads"
          />
        }
      >
        <BulkDownloadListComponent />
      </Suspense>
    </div>
  );
};

export default BulkDownloadList;
