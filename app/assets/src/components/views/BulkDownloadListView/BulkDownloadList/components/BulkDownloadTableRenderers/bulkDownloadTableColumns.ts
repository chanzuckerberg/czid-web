import { TableRenderers } from "~/components/common/TableRenderers";
import { ColumnProps } from "~/interface/sampleView";
import { BulkDownloadTableRenderers } from "./BulkDownloadTableRenderers";
import cs from "./bulk_download_table_renderers.scss";

export const getBulkDownloadTableColumns = ({
  isAdmin,
}: {
  isAdmin: boolean;
}): ColumnProps[] => {
  return [
    {
      dataKey: "downloadDisplayName",
      label: "Download",
      width: 500,
      flexGrow: 1,
      headerClassName: cs.downloadNameHeader,
      cellRenderer: (cellData: $TSFixMe) =>
        BulkDownloadTableRenderers.renderDownload(cellData, isAdmin),
    },
    {
      dataKey: "startedAt",
      label: "Date",
      width: 200,
      cellRenderer: TableRenderers.renderDateWithElapsed,
    },
    {
      dataKey: "analysisCount",
      label: "Count",
      width: 180,
      cellRenderer: BulkDownloadTableRenderers.renderCount,
    },
    {
      dataKey: "fileSize",
      label: "File Size",
      width: 200,
      cellRenderer: BulkDownloadTableRenderers.renderFileSize,
      className: cs.lightCell,
    },
    {
      dataKey: "status",
      label: "",
      width: 120,
      cellRenderer: BulkDownloadTableRenderers.renderStatus,
      disableSort: true,
    },
  ];
};
