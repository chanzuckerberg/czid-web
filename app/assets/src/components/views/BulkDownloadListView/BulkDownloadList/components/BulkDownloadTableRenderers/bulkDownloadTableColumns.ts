import TableRenderers from "~/components/views/discovery/TableRenderers";
import { ColumnProps } from "~/interface/sampleView";
import cs from "./bulk_download_table_renderers.scss";
import { BulkDownloadTableRenderers } from "./BulkDownloadTableRenderers";

export const getBulkDownloadTableColumns = ({
  isAdmin,
}: {
  isAdmin: boolean;
}): ColumnProps[] => {
  return [
    {
      dataKey: "download_name",
      label: "Download",
      width: 500,
      flexGrow: 1,
      headerClassName: cs.downloadNameHeader,
      cellRenderer: (cellData: $TSFixMe) =>
        BulkDownloadTableRenderers.renderDownload(cellData, isAdmin),
    },
    {
      dataKey: "created_at",
      label: "Date",
      width: 200,
      cellRenderer: TableRenderers.renderDateWithElapsed,
    },
    {
      dataKey: "analysis_count",
      label: "Count",
      width: 180,
      cellRenderer: BulkDownloadTableRenderers.renderCount,
    },
    {
      dataKey: "file_size",
      label: "File Size",
      width: 200,
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
