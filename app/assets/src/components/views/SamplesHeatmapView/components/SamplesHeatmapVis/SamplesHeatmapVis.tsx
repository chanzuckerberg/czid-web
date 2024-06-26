import { ButtonIcon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import d3 from "d3";
import { find, isEmpty, isEqual, keyBy, orderBy } from "lodash/fp";
import React from "react";
import BasicPopup from "~/components/common/BasicPopup";
import MetadataLegend from "~/components/common/Heatmap/MetadataLegend";
import MetadataSelector from "~/components/common/Heatmap/MetadataSelector";
import PinSampleSelector from "~/components/common/Heatmap/PinSampleSelector";
import RowGroupLegend from "~/components/common/Heatmap/RowGroupLegend";
import TaxonSelector from "~/components/common/TaxonSelector";
import { UserContext } from "~/components/common/UserContext";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";
import { logError } from "~/components/utils/logUtil";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { generateUrlToSampleView } from "~/components/utils/urls";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { splitIntoMultipleLines } from "~/helpers/strings";
import { SelectedOptions } from "~/interface/shared";
import { TooltipVizTable } from "~ui/containers";
import { IconAlertSmall, IconCloseSmall } from "~ui/icons";
import { openUrlInNewTab } from "~utils/links";
import { SPECIFICITY_OPTIONS } from "../../constants";
import { getTruncatedLabel, throttle } from "../../utils";
import { OptionsType } from "../SamplesHeatmapFilters/SamplesHeatmapFilters";
import cs from "./samples_heatmap_vis.scss";

const CAPTION_LINE_WIDTH = 180;

interface SamplesHeatmapVisProps {
  data?: object;
  taxonFilterState?: Record<string, Record<string, boolean>>;
  defaultMetadata?: $TSFixMe[];
  metadataTypes?: $TSFixMe[];
  metric?: string;
  metadataSortField?: string;
  metadataSortAsc?: boolean;
  onMetadataSortChange?: $TSFixMeFunction;
  onMetadataChange?: $TSFixMeFunction;
  onAddTaxon?: $TSFixMeFunction;
  newTaxon?: number;
  onRemoveTaxon?: $TSFixMeFunction;
  onPinSample?: $TSFixMeFunction;
  onPinSampleApply?: $TSFixMeFunction;
  onPinSampleCancel?: $TSFixMeFunction;
  onUnpinSample?: $TSFixMeFunction;
  pendingPinnedSampleIds?: $TSFixMe[];
  pinnedSampleIds?: $TSFixMe[];
  onSampleLabelClick?: $TSFixMeFunction;
  onTaxonLabelClick?: $TSFixMeFunction;
  options: OptionsType;
  sampleDetails?: object;
  sampleIds?: $TSFixMe[];
  selectedOptions: SelectedOptions;
  scale?: string;
  taxLevel?: string;
  taxonCategories?: string[];
  taxonDetails?: object;
  tempSelectedOptions?: object;
  allTaxonIds?: number[];
  taxonIds?: number[];
  selectedTaxa?: object;
  appliedFilters?: SelectedOptions;
  sampleSortType?: string;
  fullScreen?: boolean;
  taxaSortType?: string;
  backgroundName?: string;
  loading?: boolean;
}

interface SamplesHeatmapVisState {
  addTaxonTrigger: HTMLElement | null;
  addMetadataTrigger: HTMLElement | null;
  nodeHoverInfo: $TSFixMe;
  columnMetadataLegend: $TSFixMe;
  rowGroupLegend: $TSFixMe;
  selectedMetadata: Set<$TSFixMe>;
  tooltipLocation: {
    left: number;
    top: number;
  };
  displayControlsBanner: boolean;
  pinIconHovered: boolean;
  pinSampleTrigger: HTMLElement | null;
  spacePressed?: boolean;
  showingFullNames?: boolean;
}

export class SamplesHeatmapVis extends React.Component<
  SamplesHeatmapVisProps,
  SamplesHeatmapVisState
> {
  heatmap: Heatmap | null;
  heatmapContainer: HTMLElement;
  metadataTypes: $TSFixMe;
  metrics: { key: string; label: string }[];
  scale: string;
  wheelRef: React.RefObject<HTMLDivElement>;
  constructor(props: SamplesHeatmapVisProps) {
    super(props);

    this.state = {
      addTaxonTrigger: null,
      addMetadataTrigger: null,
      nodeHoverInfo: null,
      columnMetadataLegend: null,
      rowGroupLegend: null,
      selectedMetadata: new Set(this.props.defaultMetadata),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      tooltipLocation: null,
      displayControlsBanner: true,
      pinIconHovered: false,
      pinSampleTrigger: null,
      showingFullNames: false,
    };

    this.heatmap = null;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.scale = this.props.scale;

    // TODO: yet another metric name conversion to remove
    this.metrics = [
      { key: "NT.zscore", label: "NT Z Score" },
      { key: "NT.rpm", label: "NT rPM" },
      { key: "NT.r", label: "NT r (total reads)" },
      { key: "NR.zscore", label: "NR Z Score" },
      { key: "NR.rpm", label: "NR rPM" },
      { key: "NR.r", label: "NR r (total reads)" },
    ];

    this.metadataTypes = keyBy("key", this.props.metadataTypes);
    this.wheelRef = React.createRef();
  }

  componentDidMount() {
    const {
      onMetadataSortChange,
      metadataSortField,
      metadataSortAsc,
      taxonFilterState,
    } = this.props;
    const { allowedFeatures = [] } = this.context || {};

    this.heatmap = new Heatmap(
      this.heatmapContainer,
      {
        rowLabels: this.extractTaxonLabels(),
        columnLabels: this.extractSampleLabels(), // Also includes column metadata.
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        values: this.props.data[this.props.metric],
        taxonFilterState: taxonFilterState,
      },
      {
        customColorCallback: this.colorScale,
        columnMetadata: this.getSelectedMetadata(),
        initialColumnMetadataSortField: metadataSortField,
        initialColumnMetadataSortAsc: metadataSortAsc,
        onNodeHover: this.handleNodeHover,
        onMetadataNodeHover: this.handleMetadataNodeHover,
        onNodeHoverOut: this.handleNodeHoverOut,
        onColumnMetadataSortChange: onMetadataSortChange,
        onColumnMetadataLabelHover: this.handleColumnMetadataLabelHover,
        onColumnMetadataLabelOut: this.handleColumnMetadataLabelOut,
        onRowGroupEnter: this.handleRowGroupEnter,
        onRowGroupLeave: this.handleRowGroupLeave,
        onAddRowClick: this.props.onAddTaxon ? this.handleAddTaxonClick : null,
        onRemoveRow: this.props.onRemoveTaxon,
        onPinColumnClick:
          allowedFeatures.includes("heatmap_pin_samples") &&
          this.props.onPinSample
            ? this.handlePinSampleClick
            : null,
        onUnpinColumn: this.props.onUnpinSample,
        onPinIconHover: this.handlePinIconHover,
        onPinIconExit: this.handlePinIconExit,
        onCellClick: this.handleCellClick,
        onColumnLabelHover: this.handleSampleLabelHover,
        onColumnLabelOut: this.handleSampleLabelOut,
        onColumnLabelClick: this.props.onSampleLabelClick,
        onRowLabelClick: this.props.onTaxonLabelClick,
        onAddColumnMetadataClick: this.handleAddColumnMetadataClick,
        scale: this.props.scale,
        // only display colors to positive values
        scaleMin: 0,
        printCaption: this.generateHeatmapCaptions(),
        shouldSortColumns: this.props.sampleSortType === "alpha", // else cluster
        shouldSortRows: this.props.taxaSortType === "genus", // else cluster
        // Shrink to fit the viewport width
        maxWidth: this.heatmapContainer.offsetWidth,
      },
    );
    this.heatmap.start();

    if (this.props.newTaxon) {
      this.scrollToRow();
    }

    d3.select(this.wheelRef.current).on(
      "wheel",
      throttle(this.scroll, 10),
      true,
    );
    document.addEventListener("keydown", this.handleKeyDown, false);
    document.addEventListener("keyup", this.handleKeyUp, false);
  }

  componentWillUnmount() {
    d3.select(this.wheelRef.current).on("wheel", null, true);
    document.removeEventListener("keydown", this.handleKeyDown, false);
    document.removeEventListener("keyup", this.handleKeyUp, false);
  }

  componentDidUpdate(prevProps: SamplesHeatmapVisProps) {
    if (this.props.scale !== this.scale) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      this.scale = this.props.scale;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateScale(this.props.scale);
    }
    // We don't need to use isEqual() for comparing the objects `sampleDetails` and `data`.
    // This is because their references are only updated when the data changes, in which
    // case !== will pick it up.
    if (this.props.sampleDetails !== prevProps.sampleDetails) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels(), // Also includes column metadata.
      });
    }
    if (this.props.data !== prevProps.data) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        values: this.props.data[this.props.metric],
        rowLabels: this.extractTaxonLabels(),
      });
      this.scrollToRow();
    }
    if (!isEqual(this.props.taxonIds, prevProps.taxonIds)) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
        values: this.props.data[this.props.metric],
        rowLabels: this.extractTaxonLabels(),
      });
    }
    if (!isEqual(this.props.pinnedSampleIds, prevProps.pinnedSampleIds)) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels(), // Also includes column pinned state.
      });
    }
    if (!isEqual(this.props.appliedFilters, prevProps.appliedFilters)) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updatePrintCaption(this.generateHeatmapCaptions());
    }
    if (this.props.sampleSortType !== prevProps.sampleSortType) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateSortColumns(this.props.sampleSortType === "alpha");
    }
    if (this.props.taxaSortType !== prevProps.taxaSortType) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateSortRows(this.props.taxaSortType === "genus");
    }
  }

  extractSampleLabels(format: "truncated" | "full" = "truncated") {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return this.props.sampleIds.map(id => {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      const sampleDetail = this.props.sampleDetails[id];
      const { name, metadata, duplicate } = sampleDetail;
      const truncLabel = getTruncatedLabel(name);
      return {
        label: format === "full" ? name : truncLabel,
        metadata: metadata,
        printLabel: name,
        id,
        duplicateLabel: duplicate,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        pinned: this.props.pinnedSampleIds.includes(id),
        filterStateColumn: sampleDetail["index"],
      };
    });
  }

  colorScale = (
    value: $TSFixMe,
    node: $TSFixMe,
    originalColor: $TSFixMe,
    _: $TSFixMe,
    colorNoValue: $TSFixMe,
  ) => {
    const { taxonFilterState, sampleIds, taxonIds } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleId = sampleIds[node.columnIndex];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const taxonId = taxonIds[node.rowIndex];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleDetails = this.props.sampleDetails[sampleId];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const taxonDetails = this.props.taxonDetails[taxonId];

    const filtered =
      taxonFilterState?.[taxonDetails["index"]]?.[sampleDetails["index"]];
    return value > 0 && filtered ? originalColor : colorNoValue;
  };

  extractTaxonLabels() {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return this.props.taxonIds.map(id => {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      const taxon = this.props.taxonDetails[id];
      // parentId is false when taxon level is genus
      // This means there is no sortKey when set to "Taxon Level: Genus"
      const sortKey =
        taxon.parentId === -200 // MISSING_GENUS_ID
          ? Number.MAX_SAFE_INTEGER
          : taxon.parentId;
      return {
        label: taxon.name,
        sortKey: sortKey,
        genusName: taxon.genusName,
        filterStateRow: taxon["index"],
      };
    });
  }

  formatFilterString = (name, val) => {
    let stringToReturn = "";
    let numberOfFilters = 0;
    switch (name) {
      case "thresholdFilters": {
        const thresholdFilters = val.reduce(
          (result: string[], threshold: $TSFixMe) => {
            result.push(
              `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`,
            );
            return result;
          },
          [],
        );

        if (!isEmpty(thresholdFilters)) {
          numberOfFilters += thresholdFilters.length;
          stringToReturn = `Thresholds: ${thresholdFilters.join()}`;
        }
        break;
      }
      case "categories": {
        stringToReturn = `Categories: ${val}`;
        numberOfFilters += val.length;
        break;
      }
      case "subcategories": {
        const subcategories = [];
        for (const [subcategoryName, subcategoryVal] of Object.entries(val)) {
          if (!isEmpty(subcategoryVal)) {
            subcategories.push(
              // @ts-expect-error Property 'join' does not exist on type 'unknown'
              `${subcategoryName} - ${subcategoryVal.join()}`,
            );
          }
        }

        stringToReturn = `Subcategories: ${subcategories}`;
        numberOfFilters += subcategories.length;
        break;
      }
      case "readSpecificity": {
        stringToReturn = `Read Specificity: ${
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          find({ value: val }, SPECIFICITY_OPTIONS).text
        }`;
        ++numberOfFilters;
        break;
      }
      case "taxonTags": {
        stringToReturn = `Pathogen Tags: ${val}`;
        numberOfFilters += val.length;
        break;
      }

      default: {
        logError({
          message:
            "SamplesHeatmapVis: Invalid filter passed to formatFilterString()",
          details: { name, val },
        });
        break;
      }
    }
    return { string: stringToReturn, numberOfFilters };
  };

  generateHeatmapCaptions = () => {
    const { appliedFilters, selectedOptions, backgroundName, scale } =
      this.props;

    // first, note the metric, scale and background used
    const selectedOptionsString = splitIntoMultipleLines(
      `Showing ${selectedOptions.metric} for ${selectedOptions.taxonsPerSample} taxa per sample on a ${scale} scale; Background: ${backgroundName}.`,
      CAPTION_LINE_WIDTH,
    );

    // next, figure out how many filters are applied and describe them
    const filtersStrings = [];
    let nFilters = 0;

    const filterListOrder = [
      "categories",
      "readSpecificity",
      "taxonTags",
      "subcategories",
      "thresholdFilters",
    ];

    filterListOrder.forEach(name => {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      let val = appliedFilters[name];
      if (val === undefined || name === "subcategories") return;

      if (name === "categories") {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        val = [...val, ...(appliedFilters.subcategories?.Viruses || [])];
      }

      const { string, numberOfFilters } = this.formatFilterString(name, val);
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      filtersStrings.push(string);
      nFilters += numberOfFilters;
    });

    // if there are any filters applied, describe what filtered vs null data look like.
    const missingDataString =
      nFilters > 0
        ? splitIntoMultipleLines(
            `Taxa which are not present in the sample are represented by white cells. Taxa filtered out in this view have been hidden or grayed out.  ${nFilters} filter(s) applied:`,
            CAPTION_LINE_WIDTH,
          )
        : ["No filters applied."];

    // finally, describe the filters
    const filtersString = splitIntoMultipleLines(
      filtersStrings.join("; "),
      CAPTION_LINE_WIDTH,
    );

    return [...selectedOptionsString, ...missingDataString, ...filtersString];
  };

  // Update tooltip contents and location when hover over a data/metadata node
  handleNodeHover = (node: $TSFixMe) => {
    this.setState({
      nodeHoverInfo: this.getTooltipData(node),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  handleMetadataNodeHover = (node: $TSFixMe, metadata: $TSFixMe) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    const legend = this.heatmap.getColumnMetadataLegend(metadata.value);
    const currentValue = node.metadata[metadata.value] || "Unknown";
    const currentPair = { [currentValue]: legend[currentValue] };
    this.setState({
      columnMetadataLegend: currentPair,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  handleRowGroupEnter = (
    rowGroup: $TSFixMe,
    rect: $TSFixMe,
    minTop: $TSFixMe,
  ) => {
    this.setState({
      rowGroupLegend: {
        label: `Genus: ${rowGroup.genusName || "Unknown"}`,
        tooltipLocation: {
          left: rect.left + rect.width / 2,
          top: Math.max(minTop, rect.top),
        },
      },
    });
  };

  handleNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
  };

  handleColumnMetadataLabelHover = (node: $TSFixMe) => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    const legend = this.heatmap.getColumnMetadataLegend(node.value);
    this.setState({
      columnMetadataLegend: legend,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  handleColumnMetadataLabelOut = () => {
    this.setState({ columnMetadataLegend: null });
  };

  handleRowGroupLeave = () => {
    this.setState({ rowGroupLegend: null });
  };

  handleSampleLabelHover = (node: $TSFixMe) => {
    this.setState({
      columnMetadataLegend: this.getSampleTooltipData(node),
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  handleSampleLabelOut = () => {
    this.setState({ columnMetadataLegend: null });
  };

  getSampleTooltipData(node: $TSFixMe) {
    const sampleId = node.id;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleDetails = this.props.sampleDetails[sampleId];

    if (sampleDetails["duplicate"]) {
      return { "Duplicate sample name": "" };
    }
  }

  download() {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    this.heatmap.download(this.toggleFullNames);
  }

  downloadAsPng() {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    this.heatmap.downloadAsPng(this.toggleFullNames);
  }

  computeCurrentHeatmapViewValuesForCSV({ headers }: $TSFixMe) {
    // Need to specify the Taxon header. The other headers (sample names in the heatmap) will be computed in this.heatmap
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    return this.heatmap.computeCurrentHeatmapViewValuesForCSV({
      headers,
    });
  }

  getTooltipData(node: $TSFixMe) {
    const { data, taxonFilterState, sampleIds, taxonIds } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleId = sampleIds[node.columnIndex];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const taxonId = taxonIds[node.rowIndex];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleDetails = this.props.sampleDetails[sampleId];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const taxonDetails = this.props.taxonDetails[taxonId];

    const nodeHasData = this.metrics.some(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      (metric: $TSFixMe) => !!data[metric.key][node.rowIndex][node.columnIndex],
    );

    const isFiltered =
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      taxonFilterState[taxonDetails["index"]][sampleDetails["index"]];

    let values = null;
    if (nodeHasData) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      values = this.metrics.map((metric: $TSFixMe) => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        const data = this.props.data[metric.key];
        const rawVal = data[node.rowIndex][node.columnIndex];
        const value = rawVal !== null ? parseFloat(rawVal.toFixed(4)) : "-";
        return [
          metric.label,
          metric.key === this.props.metric ? <b>{value}</b> : value,
        ];
      });
    }

    let subtitle = null;

    if (!nodeHasData) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      subtitle = "This taxon was not found in the sample.";
    } else if (!isFiltered) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      subtitle = "This taxon does not satisfy the threshold filters.";
    }

    if (subtitle) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      subtitle = (
        <div className={cs.warning}>
          <IconAlertSmall className={cs.warningIcon} type="warning" />
          <div className={cs.warningText}>{subtitle}</div>
        </div>
      );
    }

    const sections = [
      {
        name: "Info",
        data: [
          ["Sample", sampleDetails.name],
          ["Taxon", taxonDetails.name],
          ["Category", taxonDetails.category],
        ],
        disabled: !isFiltered,
      },
    ];

    if (nodeHasData) {
      sections.push({
        name: "Values",
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        data: values,
        disabled: !isFiltered,
      });
    }

    return {
      subtitle,
      data: sections,
      nodeHasData,
    };
  }

  handleKeyDown = (currentEvent: $TSFixMe) => {
    if (currentEvent.code === "Space") {
      this.setState({ spacePressed: true });
    }
  };

  handleKeyUp = (currentEvent: $TSFixMe) => {
    if (currentEvent.code === "Space") {
      this.setState({ spacePressed: false });
      currentEvent.preventDefault();
    }
  };

  handleCellClick = (cell: $TSFixMe, currentEvent: $TSFixMe) => {
    const { tempSelectedOptions } = this.props;

    // Disable cell click if spacebar is pressed to pan the heatmap.
    if (!this.state.spacePressed) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      const sampleId = this.props.sampleIds[cell.columnIndex];
      const url = generateUrlToSampleView({
        sampleId,
        // @ts-expect-error Type 'object' is not assignable to type 'TempSelectedOptionsShape | Record<string, never>'.
        tempSelectedOptions,
        persistDefaultBg: true,
      });
      // @ts-expect-error Expected 1 arguments, but got 2.
      openUrlInNewTab(url, currentEvent);
    }
  };

  handleAddTaxonClick = (trigger: $TSFixMe) => {
    this.setState({
      addTaxonTrigger: trigger,
    });
  };

  handlePinSampleClick = (trigger: $TSFixMe) => {
    this.setState({
      pinSampleTrigger: trigger,
    });
  };

  handlePinIconHover = () => {
    this.setState({
      pinIconHovered: true,
    });
  };

  handlePinIconExit = () => {
    this.setState({
      pinIconHovered: false,
    });
  };

  getAvailableTaxa() {
    // taxonDetails includes entries mapping both
    // taxId => taxonDetails and taxName => taxonDetails,
    // so iterate over allTaxonIds to avoid duplicates.
    const { allTaxonIds, taxonDetails } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return allTaxonIds.map(taxId => {
      return {
        value: taxId,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        label: taxonDetails[taxId].name,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        count: taxonDetails[taxId].sampleCount,
      };
    });
  }

  scrollToRow() {
    if (this.props.newTaxon) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.scrollToRow(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        this.props.taxonDetails[this.props.newTaxon]?.name,
      );
    }
  }

  handleAddColumnMetadataClick = (trigger: $TSFixMe) => {
    this.setState({
      addMetadataTrigger: trigger,
    });
  };

  handleSelectedMetadataChange = (selectedMetadata: $TSFixMe) => {
    const { onMetadataChange } = this.props;

    const intersection = new Set(
      [...this.state.selectedMetadata].filter(metadatum =>
        selectedMetadata.has(metadatum),
      ),
    );
    const current = new Set([...intersection, ...selectedMetadata]);
    this.setState(
      {
        selectedMetadata: current,
      },
      () => {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
        this.heatmap.updateColumnMetadata(this.getSelectedMetadata());
        onMetadataChange && onMetadataChange(selectedMetadata);
      },
    );
  };

  getSelectedMetadata() {
    const sortByLabel = (a: $TSFixMe, b: $TSFixMe) =>
      a.label > b.label ? 1 : -1;

    return Array.from(this.state.selectedMetadata)
      .filter(metadatum => !!this.metadataTypes[metadatum])
      .map(metadatum => {
        return { value: metadatum, label: this.metadataTypes[metadatum].name };
      })
      .sort(sortByLabel);
  }

  getAvailableMetadataOptions() {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return this.props.metadataTypes
      .filter(metadata => {
        return metadata.key && metadata.name;
      })
      .map(metadata => {
        return { value: metadata.key, label: metadata.name };
      });
  }

  handleZoom(increment: $TSFixMe) {
    const newZoom = Math.min(
      3, // max zoom factor
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      Math.max(0.2, this.heatmap.options.zoom + increment),
    );
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    this.heatmap.updateZoom(newZoom);
  }

  hideControlsBanner = () => {
    this.setState({ displayControlsBanner: false });
  };

  scroll = () => {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    d3.event.stopImmediatePropagation();
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
    this.heatmap.scroll(d3.event);
  };

  toggleFullNames = (status?: "truncated") => {
    if (status === "truncated") {
      this.setState({ showingFullNames: false });
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels("truncated"),
      });
      return;
    }
    if (this.state.showingFullNames) {
      this.setState({ showingFullNames: false });
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels("truncated"),
      });
    } else {
      this.setState({ showingFullNames: true });
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels("full"),
      });
    }
  };

  render() {
    const {
      addTaxonTrigger,
      tooltipLocation,
      nodeHoverInfo,
      columnMetadataLegend,
      rowGroupLegend,
      addMetadataTrigger,
      selectedMetadata,
      pinSampleTrigger,
      pinIconHovered,
    } = this.state;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    let pinSampleOptions = this.props.sampleIds.map(id => {
      return {
        id,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        name: this.props.sampleDetails[id].name,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        pinned: this.props.pinnedSampleIds.includes(id),
      };
    });
    pinSampleOptions = orderBy(
      ["pinned", "name"],
      ["desc", "asc"],
      pinSampleOptions,
    );

    return (
      <>
        <div className={cs.samplesHeatmapVis} ref={this.wheelRef}>
          <div className={cs.rightSideOverlay}></div>
          <PlusMinusControl
            onPlusClick={() => this.handleZoom(0.25)}
            onMinusClick={() => this.handleZoom(-0.25)}
            className={cs.plusMinusControl}
          />
          <Tooltip
            arrow
            sdsStyle={"dark"}
            title={`${
              this.state.showingFullNames ? "Truncate" : "Expand"
            } Sample Names`}
          >
            <ButtonIcon
              on={this.state.showingFullNames}
              sdsSize="small"
              sdsType="secondary"
              sdsIcon="chevronRight2"
              className={cx(
                cs.toggleNamesButton,
                this.state.showingFullNames && cs.open,
              )}
              onClick={() => this.toggleFullNames()}
              disabled={
                this.extractSampleLabels("truncated").filter(
                  columnLabel => columnLabel.printLabel.length > 20,
                ).length === 0
              }
            />
          </Tooltip>
          <div
            className={cs.heatmapContainer}
            ref={container => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              this.heatmapContainer = container;
            }}
          />
          <div
            className={cx(
              cs.bannerContainer,
              this.state.displayControlsBanner ? cs.show : cs.hide,
            )}
          >
            <div className={cs.bannerText}>
              Hold SHIFT to scroll horizontally and SPACE BAR to pan.
              <IconCloseSmall
                className={cs.removeIcon}
                onClick={this.hideControlsBanner}
              />
            </div>
          </div>
          {nodeHoverInfo && tooltipLocation && (
            <div
              className={cx(cs.tooltip, nodeHoverInfo && cs.visible)}
              style={getTooltipStyle(tooltipLocation, {
                buffer: 20,
                below: true,
                // so we can show the tooltip above the cursor if need be
                height: nodeHoverInfo.nodeHasData ? 300 : 180,
              })}
            >
              <TooltipVizTable {...nodeHoverInfo} />
            </div>
          )}
        </div>

        {columnMetadataLegend && tooltipLocation && (
          <MetadataLegend
            metadataColors={columnMetadataLegend}
            tooltipLocation={tooltipLocation}
          />
        )}
        {pinIconHovered && tooltipLocation && (
          <div
            className={cx(cs.tooltip, cs.visible)}
            style={{
              left: tooltipLocation.left,
              top: tooltipLocation.top - 10,
            }}
          >
            <BasicPopup
              basic={false}
              content="Unpin"
              open // Make sure the tooltip is visible as long as the container is visible.
              position="top center"
              // Pass in an empty div because the tooltip requires a trigger element.
              trigger={<div />}
            />
          </div>
        )}
        {rowGroupLegend && <RowGroupLegend {...rowGroupLegend} />}
        {addMetadataTrigger && (
          <MetadataSelector
            addMetadataTrigger={addMetadataTrigger}
            selectedMetadata={selectedMetadata}
            metadataTypes={this.getAvailableMetadataOptions()}
            onMetadataSelectionChange={this.handleSelectedMetadataChange}
            onMetadataSelectionClose={() => {
              this.setState({ addMetadataTrigger: null });
            }}
          />
        )}
        {addTaxonTrigger && (
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
          <TaxonSelector
            addTaxonTrigger={addTaxonTrigger}
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 0-1 arguments, but got 2.
            selectedTaxa={new Set(this.props.taxonIds, this.props.selectedTaxa)}
            availableTaxa={this.getAvailableTaxa()}
            sampleIds={this.props.sampleIds}
            onTaxonSelectionChange={(selected: $TSFixMe) => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
              this.props.onAddTaxon(selected);
            }}
            onTaxonSelectionClose={() => {
              this.setState({ addTaxonTrigger: null });
            }}
            taxLevel={this.props.taxLevel}
          />
        )}
        {pinSampleTrigger && (
          <PinSampleSelector
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onApply={this.props.onPinSampleApply}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onCancel={this.props.onPinSampleCancel}
            onClose={() => {
              this.setState({ pinSampleTrigger: null });
            }}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            onSelectionChange={this.props.onPinSample}
            options={pinSampleOptions}
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            selectedSamples={this.props.pendingPinnedSampleIds}
            selectSampleTrigger={pinSampleTrigger}
          />
        )}
      </>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
SamplesHeatmapVis.defaultProps = {
  defaultMetadata: [],
};

SamplesHeatmapVis.contextType = UserContext;
