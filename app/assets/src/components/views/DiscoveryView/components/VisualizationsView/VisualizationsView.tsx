import { Icon } from "@czi-sds/components";
import { merge, pick } from "lodash/fp";
import React from "react";
import { SortDirectionType } from "react-virtualized";
import { TableRenderers } from "~/components/views/components/TableRenderers";
import { BaseDiscoveryView } from "~/components/views/DiscoveryView/components/BaseDiscoveryView";
import { GlobalContext } from "~/globalContext/reducer";
import { humanize } from "~/helpers/strings";
import StatusLabel from "~ui/labels/StatusLabel";
import { openUrl } from "~utils/links";
import { ObjectCollectionView } from "../../DiscoveryDataLayer";
import cs from "./visualizations_view.scss";

// Maps SFN execution statuses to classic frontend statuses
const STATUS_MAPPING = {
  CREATED: "CREATED",
  RUNNING: "RUNNING",
  SUCCEEDED: "COMPLETE",
  SUCCEEDED_WITH_ISSUE: "COMPLETE",
  FAILED: "FAILED",
};

const STATUS_TYPE = {
  CREATED: "default",
  RUNNING: "default",
  SUCCEEDED: "success",
  SUCCEEDED_WITH_ISSUE: "success",
  FAILED: "error",
};

export interface Visualization {
  id: number;
  name: string;
  project_name: string;
  samples_count: number;
  status: string;
  updated_at: string;
  user_id: number;
  user_name: string;
  visualization_type: string;
}

interface VisualizationsViewProps {
  currentDisplay: string;
  visualizations: ObjectCollectionView<Visualization, number>;
  onLoadRows: $TSFixMeFunction;
  onSortColumn?: $TSFixMeFunction;
  sortBy?: string;
  sortDirection?: SortDirectionType;
  sortable?: boolean;
}

// See also ProjectsView which is very similar
export class VisualizationsView extends React.Component<VisualizationsViewProps> {
  columns: $TSFixMe;
  discoveryView: $TSFixMe;
  static contextType = GlobalContext;
  constructor(props: VisualizationsViewProps) {
    super(props);

    this.discoveryView = null;

    this.columns = [
      {
        dataKey: "visualization",
        flexGrow: 1,
        width: 350,
        cellRenderer: ({ cellData }: $TSFixMe) =>
          TableRenderers.renderVisualization(
            merge(
              { cellData },
              {
                nameRenderer: this.nameRenderer,
                detailsRenderer: this.detailsRenderer,
                statusRenderer: this.statusRenderer,
                visibilityIconRenderer: this.visibilityIconRenderer,
              },
            ),
          ),
        headerClassName: cs.visualizationHeader,
        sortKey: (p: $TSFixMe) => p && p.updated_at,
      },
      {
        dataKey: "updated_at",
        label: "Updated On",
        width: 120,
        cellRenderer: TableRenderers.renderDateWithElapsed,
      },
      {
        dataKey: "project_name",
        width: 280, // big enough for "mBAL-PLASMA and Medical Detectives"
        label: "Project",
      },
      {
        dataKey: "samples_count",
        width: 140,
        label: "Samples",
      },
    ];
  }

  nameRenderer = (visualization: $TSFixMe) => {
    return (
      <div>
        {visualization
          ? visualization.name || humanize(visualization.visualization_type)
          : ""}
      </div>
    );
  };

  statusRenderer = (visualization: $TSFixMe) => {
    return (
      <div>
        {visualization && visualization.status && (
          <StatusLabel
            className={cs.sampleStatus}
            status={STATUS_MAPPING[visualization.status]}
            type={STATUS_TYPE[visualization.status]}
          />
        )}
      </div>
    );
  };

  visibilityIconRenderer = (visualization: $TSFixMe) => {
    if (!visualization) return <div className={cs.icon} />;

    const { visualization_type: visualizationType, publicAccess } =
      visualization;
    if (visualizationType === "heatmap") {
      return publicAccess ? (
        <Icon sdsIcon="gridPublic" sdsSize="xl" sdsType="static" />
      ) : (
        <Icon sdsIcon="gridPrivate" sdsSize="xl" sdsType="static" />
      );
    } else if (["phylo_tree", "phylo_tree_ng"].includes(visualizationType)) {
      return publicAccess ? (
        <Icon sdsIcon="treeHorizontalPublic" sdsSize="xl" sdsType="static" />
      ) : (
        <Icon sdsIcon="treeHorizontalPrivate" sdsSize="xl" sdsType="static" />
      );
    } else if (!["table", "tree"].includes(visualizationType)) {
      // eslint-disable-next-line no-console
      console.error(`Unknown visualization type: ${visualizationType}`);
    }
  };

  detailsRenderer(visualization: Visualization) {
    return <div>{visualization ? visualization.user_name : ""}</div>;
  }

  handleRowClick = ({ rowData }: $TSFixMe) => {
    const url = `/visualizations/${rowData.visualization.visualization_type}/${rowData.id}`;
    // @ts-expect-error Type 'Event' is missing the following properties
    openUrl(url, event);
  };

  handleLoadRowsAndFormat = async (args: $TSFixMe) => {
    const { onLoadRows } = this.props;
    const visualizationsArray = await onLoadRows(args);

    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    return visualizationsArray.map((visualization: Visualization) => {
      return merge(
        {
          visualization: pick(
            [
              "user_name",
              "visualization_type",
              "name",
              "publicAccess",
              "status",
            ],
            visualization,
          ),
        },
        pick(
          ["id", "updated_at", "project_name", "samples_count"],
          visualization,
        ),
      );
    });
  };

  handleSortColumn = ({
    sortBy,
    sortDirection,
  }: {
    sortBy: string;
    sortDirection: SortDirectionType;
  }) => {
    // Calls onSortColumn callback to fetch sorted data
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
    this.props.onSortColumn({ sortBy, sortDirection });
  };

  reset = () => {
    const { currentDisplay } = this.props;
    currentDisplay === "table" &&
      this.discoveryView &&
      this.discoveryView.reset();
  };

  render() {
    const { sortBy, sortDirection, sortable } = this.props;

    return (
      <BaseDiscoveryView
        columns={this.columns}
        handleRowClick={this.handleRowClick}
        onLoadRows={this.handleLoadRowsAndFormat}
        onSortColumn={this.handleSortColumn}
        ref={discoveryView => (this.discoveryView = discoveryView)}
        sortable={sortable}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    );
  }
}
