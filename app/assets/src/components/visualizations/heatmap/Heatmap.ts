import cx from "classnames";
import Cluster from "clusterfck";
import d3 from "d3";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { compact, orderBy, some } from "lodash";
import { clamp, find, isEqual, mean, minBy, sortBy } from "lodash/fp";
import SvgSaver from "svgsaver";
import textWidth from "text-width";
import { sanitizeCSVRow } from "~/components/utils/csv";
import { CategoricalColormap } from "../../utils/colormaps/CategoricalColormap";
import symlog from "../../utils/d3/scales/symlog";
import addSvgColorFilter from "../../utils/d3/svg";
import cs from "./heatmap.scss";

// used for filter to make plus icon blue
const COLOR_HOVER_LINK = cs.primaryLight;
// CSS Field constants
const TEXT_ANCHOR = "text-anchor";
const XLINK_HREF = "xlink:href";

// TODO(tcarvalho): temporary hack to send elements to the back.
// Remove once code is ported to d3 v4, which contains this function.
d3.selection.prototype.lower = function () {
  return this.each(function (this: $TSFixMe) {
    const firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

interface dProps {
  columnIndex: number;
  duplicateLabel: boolean;
  filterStateColumn: number;
  id: number;
  label: string;
  metadata: {
    collection_date: string;
    collection_location_v2: string;
    nucleotide_type: string;
    sample_type: string;
    water_control: string;
  };
  pinned: boolean;
  pos: number;
  shaded: boolean;
}

export interface HeatmapData {
  rowLabels: {
    genusName: string;
    label: string;
    sortKey: number;
  }[];
  columnLabels: {
    duplicateLabel: boolean;
    id: number;
    label: string;
    metadata: object;
    pinned: boolean;
  }[];
  values: RowWithIndex[];
  taxonFilterState?: Record<string, Record<string, boolean>>;
}

type RowWithIndex = number[] & { idx?: number };

export default class Heatmap {
  addMetadataTrigger: $TSFixMe;
  addRowBackground: $TSFixMe;
  addRowTrigger: $TSFixMe;
  bgGrid: $TSFixMe;
  bgPattern: $TSFixMe;
  cell: $TSFixMe;
  cells: $TSFixMe;
  columnClusterHeight: $TSFixMe;
  columnClustering: $TSFixMe;
  columnLabels: $TSFixMe;
  columnLabelsBackground: $TSFixMe;
  columnLabelsHeight: number;
  columnMetadataSortAsc: $TSFixMe;
  columnMetadataSortField: $TSFixMe;
  container: $TSFixMe;
  data: HeatmapData;
  defs: $TSFixMe;
  filteredCells: $TSFixMe;
  filteredRowLabels: $TSFixMe;
  g: $TSFixMe;
  gAddRow: $TSFixMe;
  gCaption: $TSFixMe;
  gCellHover: $TSFixMe;
  gCells: $TSFixMe;
  gColumnDendogram: $TSFixMe;
  gColumnLabels: $TSFixMe;
  gColumnMetadata: $TSFixMe;
  gPinColumn: $TSFixMe;
  gRowDendogram: $TSFixMe;
  gRowLabels: $TSFixMe;
  height: $TSFixMe;
  limits: $TSFixMe;
  metadataColors: $TSFixMe;
  metadataLabelsBackground: $TSFixMe;
  mouseDown: $TSFixMe;
  mouseX: $TSFixMe;
  mouseY: $TSFixMe;
  options: { zoom: number; [x: string]: any };
  overlays: $TSFixMe;
  overlaysDebounce: $TSFixMe;
  pinColumnTrigger: $TSFixMe;
  previousNullHover: $TSFixMe;
  rowClusterWidth: $TSFixMe;
  rowClustering: $TSFixMe;
  rowLabels: $TSFixMe;
  rowLabelsBackground: $TSFixMe;
  rowLabelsWidth: $TSFixMe;
  scaleLimits: $TSFixMe;
  scaleType: $TSFixMe;
  scrollToRowInProgess: $TSFixMe;
  spacePressed: $TSFixMe;
  svg: $TSFixMe;
  svgSaver: $TSFixMe;
  totalMetadataHeight: $TSFixMe;
  totalRowAddLinkHeight: $TSFixMe;
  width: $TSFixMe;

  constructor(
    container: HTMLElement,
    data: HeatmapData,
    options: Record<string, any>,
  ) {
    this.mouseDown = false;
    this.svg = null;
    this.g = null;
    this.container = d3.select(container);
    this.data = data;
    this.svgSaver = new SvgSaver();

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.options = Object.assign(
      {
        numberOfLevels: 10,
        scale: "linear",
        fontSize: "9pt",
        textRotation: -65,
        marginTop: 30,
        marginLeft: 20,
        marginBottom: 20,
        marginRight: 20,
        marginAddLink: 25,
        marginAddLinkImg: 20,
        metadataSortIconSize: 16,
        minCellWidth: 26,
        minCellHeight: 26,
        minWidth: 1240,
        maxWidth: 1600, // used for shrink-to-fit
        zoom: null, // multiplier for zooming in and out
        minHeight: 500,
        clustering: true,
        shouldSortColumns: false,
        shouldSortRows: false,
        defaultClusterStep: 6,
        maxRowClusterWidth: 100,
        maxColumnClusterHeight: 100,
        spacing: 10,
        metadataAddLinkHeight: 14,
        transitionDuration: 200,
        nullValue: 0,
        columnMetadata: [],
        enableColumnMetadata: false,
        metadataColorScale: new CategoricalColormap(),
        iconPath: "/assets/icons",
        // This is needed for downloading PNG and SVG on solid background
        svgBackgroundColor: "white",
        // force limits
        scaleMin: null,
        scaleMax: null,
        // data color scale settings
        // if the customColor function is set, it will be called with value and
        // the original color assigned to it.
        // This will allow the client to override any color if necessary.
        // The signature of customColor is customColor(value, data_node, originalColor, colors, colorNoValue)
        customColorCallback: null,
        colors: null,
        colorNoValue: "#eaeaea",
        // The caption to add when the heatmap is saved as an SVG or PNG.
        printCaption: [],
        captionLineHeight: 18,
      },
      options,
    );
    if (!this.options.colors) {
      const defaultColorScale = scaleSequential(interpolateYlOrRd);
      this.options.colors = this.range(this.options.numberOfLevels).map(i =>
        defaultColorScale(i / (this.options.numberOfLevels - 1)),
      );
    }

    this.rowClusterWidth = this.options.maxRowClusterWidth;
    this.columnClusterHeight = this.options.maxRowClusterWidth;
    this.scaleType = this.getScaleType();

    this.addMetadataTrigger = null;
    this.columnMetadataSortField = this.options.initialColumnMetadataSortField;
    this.columnMetadataSortAsc = this.options.initialColumnMetadataSortAsc;

    this.addRowTrigger = null;

    this.overlays = []; // rectangle overlays used for highlighting rows/columns
    this.overlaysDebounce = false; // used to reduce flickering when highlight row/column labels
    this.previousNullHover = null; // track the last cell with no data that we hovered on
    this.bgGrid = null; // grey background grid
    this.bgPattern = null; // SVG pattern used in the background grid to simulate cells we don't render
    this.gCellHover = null; // square used to add border around the cell being hovered on
  }

  getScaleType() {
    return this.options.scale === "symlog" ? symlog : d3.scale.linear;
  }

  start() {
    this.processData();
  }

  processData(
    start?:
      | "setupContainers"
      | "parse"
      | "filter"
      | "processMetadata"
      | "cluster"
      | "placeContainers"
      | "update",
  ) {
    // This function implements the pipeline for preparing data
    // and svg for heatmap display.
    // Starting point can be chosen given what data was changed.
    if (!start) start = "setupContainers";
    switch (start) {
      case "setupContainers":
        this.setupContainers();
      // falls through
      case "parse":
        this.parseData();
      // falls through
      case "filter":
        this.filterData();
      // falls through
      case "processMetadata":
        this.processMetadata();
      // falls through
      case "cluster":
        this.cluster();
      // falls through
      case "placeContainers":
        this.placeContainers();
      // falls through
      case "update":
        this.update();
        break;
      default:
        break;
    }
  }

  updateZoom(zoom: number) {
    this.options.zoom = zoom;
    this.svg
      .attr("width", this.width * this.options.zoom)
      .attr("height", this.height * this.options.zoom);
  }

  updateScale(scale: $TSFixMe) {
    this.options.scale = scale;
    this.scaleType = this.getScaleType();
    this.processData("cluster");
  }

  updateSortColumns(shouldSortColumns: $TSFixMe) {
    this.options.shouldSortColumns = shouldSortColumns;
    this.processData("cluster");
  }

  updateSortRows(shouldSortRows: $TSFixMe) {
    this.options.shouldSortRows = shouldSortRows;
    this.processData("cluster");
  }

  updateColumnMetadata(metadata: $TSFixMe) {
    this.options.columnMetadata = metadata;
    this.processData("processMetadata");
  }

  updateData(data: $TSFixMe) {
    this.data = Object.assign(this.data, data);
    this.processData("parse");
  }

  updatePrintCaption(printCaption: $TSFixMe) {
    this.options.printCaption = printCaption;
  }

  parseData() {
    this.rowLabels = this.data.rowLabels.map((row: $TSFixMe, pos: $TSFixMe) => {
      return Object.assign({ pos, shaded: false }, row);
    });
    this.columnLabels = this.data.columnLabels.map(
      (column: $TSFixMe, pos: $TSFixMe) => {
        return Object.assign({ pos, shaded: false }, column);
      },
    );

    // get heatmap size and margins from data
    this.rowLabelsWidth = 0;
    this.columnLabelsHeight = 0;

    const labelWidth = (label: $TSFixMe) =>
      textWidth(label, { size: this.options.fontSize });

    for (let i = 0; i < this.rowLabels.length; i++) {
      const label = this.rowLabels[i].label;
      this.rowLabelsWidth = Math.max(this.rowLabelsWidth, labelWidth(label));
    }

    for (let i = 0; i < this.options.columnMetadata.length; i++) {
      // Get label width and compensate for icon size
      const label =
        this.options.columnMetadata[i].label +
        this.options.metadataSortIconSize;
      this.rowLabelsWidth = Math.max(this.rowLabelsWidth, labelWidth(label));
    }

    for (let j = 0; j < this.columnLabels.length; j++) {
      const label = this.columnLabels[j].label;
      this.columnLabelsHeight = Math.max(
        this.columnLabelsHeight,
        labelWidth(label),
      );
    }
    this.columnLabelsHeight *= Math.abs(
      Math.cos((90 + this.options.textRotation) * (Math.PI / 180)),
    );

    // 2x'spacing' pixels for the 'x': replace by proper size
    this.rowLabelsWidth += this.options.spacing + 2 * this.options.spacing;
    this.columnLabelsHeight += this.options.spacing;

    // do not impose options.scaleMin, and options.scaleMax here,
    // because it can mess up clustering
    this.limits = {
      min: Math.min(
        d3.min(this.data.values, (array: $TSFixMe) => d3.min(array)),
        this.options.nullValue,
      ),
      max: Math.max(
        d3.max(this.data.values, (array: $TSFixMe) => d3.max(array)),
        this.options.nullValue,
      ),
    };

    this.scaleLimits = {
      min:
        this.options.scaleMin || this.options.scaleMin === 0
          ? this.options.scaleMin
          : this.limits.min,
      max:
        this.options.scaleMax || this.options.scaleMax === 0
          ? this.options.scaleMax
          : this.limits.max,
    };

    this.cells = [];
    for (let i = 0; i < this.rowLabels.length; i++) {
      const { taxonFilterState } = this.data;
      this.rowLabels[i].rowIndex = i;
      const { filterStateRow } = this.rowLabels[i];

      for (let j = 0; j < this.columnLabels.length; j++) {
        this.columnLabels[j].columnIndex = j;
        const { filterStateColumn } = this.columnLabels[j];

        // Filter info is not always present (as indicated by the type definition)
        // The deprecated AMR heatmap instantiates this object, but does not have filter info
        const filterInfoPresent =
          taxonFilterState !== undefined &&
          filterStateRow !== undefined &&
          filterStateColumn !== undefined;
        const meetsUserFilters = filterInfoPresent
          ? taxonFilterState[filterStateRow][filterStateColumn]
          : true;

        this.cells.push({
          id: `${i},${j}`,
          rowIndex: i,
          columnIndex: j,
          value: this.data.values[i][j],
          meetsUserFilters,
        });
      }
    }
  }

  filterData() {
    this.filteredCells = this.cells.filter(
      // Don't render cells with value = null or undefined (but render cells with value 0)
      (cell: $TSFixMe) =>
        !this.rowLabels[cell.rowIndex].hidden && cell.value != null,
    );

    // Initially sort so that genus seperators are placed correctly
    this.filteredRowLabels = orderBy(
      this.rowLabels.filter((row: $TSFixMe) => !row.hidden),
      label => label.sortKey || label.label,
    );
  }

  setupContainers() {
    this.svg = this.container
      .append("svg")
      .attr("class", cs.heatmap)
      .attr("id", "visualization")
      .attr("xmlns", "http://www.w3.org/2000/svg");

    // Not standard but it works for downloads and svgsaver. See:
    // https://stackoverflow.com/questions/11293026/default-background-color-of-svg-root-element
    this.svg.attr(
      "style",
      `background-color: ${this.options.svgBackgroundColor}`,
    );

    const defs = this.svg.append("defs");
    this.defs = defs;
    // Create a blue color filter to match $primary-light.
    addSvgColorFilter(defs, "blue", COLOR_HOVER_LINK);

    this.g = this.svg.append("g");
    this.gCells = this.g.append("g");
    this.gRowDendogram = this.g
      .append("g")
      .attr("class", cx(cs.dendogram, cs.rowDendogram));
    this.gColumnDendogram = this.g
      .append("g")
      .attr("class", cx(cs.dendogram, "columnDendogram"));
    this.rowLabelsBackground = this.g
      .append("rect")
      .attr("class", "rowLabelBackground")
      .style("fill", "white");
    this.gRowLabels = this.g.append("g").attr("class", cs.rowLabels);
    this.columnLabelsBackground = this.g
      .append("rect")
      .attr("class", "columnLabelBackground")
      .style("fill", "white");
    this.gColumnLabels = this.g.append("g").attr("class", cs.columnLabels);
    this.metadataLabelsBackground = this.g
      .append("rect")
      .attr("class", "metadataLabelsBackground")
      .style("fill", "white");
    this.addRowBackground = this.g
      .append("rect")
      .attr("class", "addRowBackground")
      .style("fill", "white");

    this.gColumnMetadata = this.g.append("g").attr("class", cs.columnMetadata);
    this.gAddRow = this.g.append("g").attr("class", cs.columnMetadata);
    this.gPinColumn = this.g.append("g").attr("class", cs.columnMetadata);
    this.gCaption = this.g.append("g").attr("class", cs.captionContainer);
  }

  placeContainers() {
    this.rowClusterWidth = Math.min(
      this.getDepth(this.rowClustering) * this.options.defaultClusterStep +
        this.options.spacing,
      this.options.maxRowClusterWidth,
    );
    this.columnClusterHeight = Math.min(
      this.getDepth(this.columnClustering) * this.options.defaultClusterStep +
        this.options.spacing,
      this.options.maxColumnClusterHeight,
    );

    this.cell = {
      width: Math.max(
        (this.options.minWidth - this.rowLabelsWidth - this.rowClusterWidth) /
          this.columnLabels.length,
        this.options.minCellWidth,
      ),
      height: Math.max(
        (this.options.minHeight -
          this.columnLabelsHeight -
          this.columnClusterHeight) /
          this.rowLabels.length,
        this.options.minCellHeight,
      ),
    };

    const totalCellWidth = this.cell.width * this.columnLabels.length;
    const totalRowClusterWidth = this.options.clustering
      ? this.rowClusterWidth
      : 0;

    const totalColumnLabelsHeight = this.columnLabelsHeight;
    this.totalMetadataHeight =
      this.options.columnMetadata.length * this.options.minCellHeight +
      this.options.metadataAddLinkHeight;
    const totalCellHeight = this.cell.height * this.filteredRowLabels.length;
    const totalColumnClusterHeight = this.options.clustering
      ? this.columnClusterHeight + this.options.spacing * 2
      : 0;

    // If there's no option to manually add additional rows, don't make the gap
    // between metadata and the rest of the heatmap as wide.
    this.totalRowAddLinkHeight = this.options.onAddRowClick
      ? 2 * this.options.metadataAddLinkHeight
      : this.options.metadataAddLinkHeight;

    this.width =
      this.options.marginLeft +
      this.rowLabelsWidth +
      totalCellWidth +
      totalRowClusterWidth +
      this.options.marginRight;

    this.height =
      this.options.marginTop +
      this.columnLabelsHeight +
      this.totalMetadataHeight +
      this.totalRowAddLinkHeight +
      totalCellHeight +
      totalColumnClusterHeight +
      this.options.marginBottom +
      this.options.spacing;

    this.svg.attr("viewBox", `0 0 ${this.width} ${this.height}`);

    this.options.zoom = this.getZoomFactor();

    // If we make these numbers larger than the viewport dimensions we’ll
    // effectively zoom out, and if we make them smaller we’ll zoom in.
    this.svg
      .attr("width", this.width * this.options.zoom)
      .attr("height", this.height * this.options.zoom);

    this.g.attr(
      "transform",
      `translate(${this.options.marginLeft},${this.options.marginTop})`,
    );
    this.rowLabelsBackground
      .attr("width", this.rowLabelsWidth + this.options.marginLeft)
      .attr("height", totalCellHeight + totalColumnClusterHeight);
    this.placeRowLabelContainers(0);
    this.columnLabelsBackground
      .attr(
        "width",
        this.rowLabelsWidth +
          totalCellWidth +
          totalRowClusterWidth +
          this.options.marginRight,
      )
      .attr(
        "height",
        totalColumnLabelsHeight +
          this.totalMetadataHeight +
          this.options.marginTop,
      );
    this.metadataLabelsBackground
      .attr("width", this.rowLabelsWidth + this.options.marginLeft)
      .attr("height", totalColumnLabelsHeight + this.options.marginTop);
    if (!this.scrollToRowInProgess) {
      this.placeColumnLabelAndMetadataContainers(this.columnLabelsHeight);
      this.placePinColumnLinkContainer(this.columnLabelsHeight);

      this.addRowBackground
        .attr(
          "width",
          this.rowLabelsWidth +
            totalCellWidth +
            totalRowClusterWidth +
            this.options.marginRight,
        )
        .attr(
          "height",
          this.totalRowAddLinkHeight + this.options.metadataAddLinkHeight,
        );
      this.placeAddRowLinkContainer(this.columnLabelsHeight);
    } else {
      this.scrollToRowInProgess = false;
    }

    this.gCells.attr(
      "transform",
      `translate(${this.rowLabelsWidth},
        ${
          totalColumnLabelsHeight +
          this.totalMetadataHeight +
          this.totalRowAddLinkHeight
        })`,
    );

    // Draw dendrogram
    this.gRowDendogram.attr(
      "transform",
      `translate(
        ${this.rowLabelsWidth + totalCellWidth},
        ${
          totalColumnLabelsHeight +
          this.totalMetadataHeight +
          this.totalRowAddLinkHeight
        }
      )`,
    );
    this.gColumnDendogram.attr(
      "transform",
      `translate(
        ${this.rowLabelsWidth},
        ${
          totalColumnLabelsHeight +
          this.totalMetadataHeight +
          this.totalRowAddLinkHeight +
          totalCellHeight
        }
      )`,
    );
    this.gCaption.attr(
      "transform",
      `translate(${this.rowLabelsWidth},
        ${
          totalColumnLabelsHeight +
          this.totalMetadataHeight +
          this.totalRowAddLinkHeight +
          totalCellHeight +
          totalColumnClusterHeight +
          this.options.spacing
        }
      )`,
    );

    // Set up space bar+click to pan behavior.
    d3.select("body")
      .on("keydown", () => {
        if (d3.event.code === "Space") {
          this.svg.style("cursor", "move");
          this.spacePressed = true;
        }
      })
      .on("keyup", () => {
        if (d3.event.code === "Space") {
          this.svg.style("cursor", "auto");
          this.spacePressed = false;
        }
      });

    this.svg
      .on("mousedown", () => {
        this.mouseDown = true;
        if (this.spacePressed) {
          this.mouseX = d3.event.clientX;
          this.mouseY = d3.event.clientY;
          d3.event.preventDefault();
        }
      })
      .on("mousemove", this.drag.bind(this))
      .on("mouseup", () => {
        this.mouseDown = false;
      });

    // Set up scrolling behavior.
    this.g.on("wheel.zoom", this.scroll.bind(this));
  }

  drag() {
    if (this.mouseDown && this.spacePressed) {
      this.pan(d3.event.clientX - this.mouseX, d3.event.clientY - this.mouseY);
      this.mouseX = d3.event.clientX;
      this.mouseY = d3.event.clientY;
    }
  }

  scroll(event?: $TSFixMe) {
    if (event) {
      this.pan(-event.deltaX, -event.deltaY);
    } else {
      this.pan(-d3.event.deltaX, -d3.event.deltaY);
    }
    d3.event.preventDefault(); // prevent browser from navigating away from page when scroll
    d3.event.stopPropagation(); // don't propagate the event to the element's parent
  }

  scrollToRow(label: $TSFixMe) {
    // If there's a specific row we want to focus on, auto-scroll the heatmap
    // so the row is centered on screen.
    const row = this.rowLabels.filter(
      (rowLabel: $TSFixMe) => rowLabel.label === label,
    )[0];
    if (row) {
      const rowIndex = row.rowIndex;

      const containerHeight: number = this.container[0][0].offsetHeight;
      const metadataHeight: number =
        this.totalMetadataHeight + this.totalRowAddLinkHeight;
      const rowOffset =
        containerHeight / 4 - (this.cellYPosition(row) + metadataHeight);
      this.scrollToRowInProgess = true;
      this.pan(0, rowOffset, true);

      // Briefly highlight the focused row.
      this.rowLabels[rowIndex].highlighted = true;
      this.highlightRowOrColumn(this.rowLabels[rowIndex]);
      this.updateLabelHighlights(
        this.gRowLabels.selectAll(`.${cs.rowLabel}`),
        this.rowLabels,
      );

      this.rowLabels[rowIndex].highlighted = false;
      setTimeout(() => {
        this.highlightRowOrColumn(null);
        this.rowLabels[rowIndex].highlighted = false;
        this.updateLabelHighlights(
          this.gRowLabels.selectAll(`.${cs.rowLabel}`),
          this.rowLabels,
        );
      }, 2750);
    }
  }

  pan(deltaX: $TSFixMe, deltaY: $TSFixMe, transition = false) {
    // Define the scrolling boundaries for the svg.
    // Upper limits are determined by the difference between the container and svg sizes,
    // scaled by the zoom factor.
    const containerWidth: number = this.container[0][0].offsetWidth;
    const containerHeight: number = this.container[0][0].offsetHeight;
    const xScrollMax =
      (containerWidth - Number(this.svg.attr("width"))) / this.options.zoom;
    const yScrollMax =
      (containerHeight - Number(this.svg.attr("height"))) / this.options.zoom;
    // Translating the svg:
    const gCurrentTranslate = d3.transform(this.g.attr("transform")).translate;
    // Limit translation by the boundaries set for the svg.
    const dx = Math.min(
      this.options.marginLeft,
      Math.max(deltaX + gCurrentTranslate[0], xScrollMax),
    );
    const dy = Math.min(
      this.options.marginTop,
      Math.max(deltaY + gCurrentTranslate[1], yScrollMax),
    );

    if (transition) {
      this.g
        .transition()
        .duration(this.options.transitionDuration)
        .attr("transform", `translate(${[dx, dy]})`);
    } else {
      this.g.attr("transform", `translate(${[dx, dy]})`);
    }

    // Translating the row labels in the opposite x direction of the svg.
    const rowLabelsCurrent = d3.transform(
      this.gRowLabels.attr("transform"),
    ).translate;
    const labelsDx = clamp(
      0,
      -xScrollMax + this.options.marginLeft,
      rowLabelsCurrent[0] - deltaX,
    );
    this.placeRowLabelContainers(labelsDx);

    // Translating the metadata labels and "Add Metadata link" in
    // the opposite x direction of the svg (same as row labels).
    // Don't include the transition animation while rendering.
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'LodashClamp1x5' is not assignabl... Remove this comment to see the full error message
    this.renderColumnMetadata(labelsDx, false);
    this.renderRowAddLink(labelsDx);
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'LodashClamp1x5' is not assignabl... Remove this comment to see the full error message
    this.renderPinColumnLink(labelsDx);

    // Translating the column and metadata labels in the opposite y direction of the svg.
    const columnLabelsCurrent = d3.transform(
      this.gColumnLabels.attr("transform"),
    ).translate;
    const labelsDy = clamp(
      this.columnLabelsHeight,
      this.columnLabelsHeight + this.options.marginTop - yScrollMax,
      columnLabelsCurrent[1] - deltaY,
    );
    this.placeColumnLabelAndMetadataContainers(labelsDy, transition);
    this.placePinColumnLinkContainer(labelsDy, transition);
    this.placeAddRowLinkContainer(labelsDy, transition);
  }

  placeRowLabelContainers(x: $TSFixMe) {
    const totalMetadataHeight = this.totalMetadataHeight;
    const totalRowAddLinkHeight = this.totalRowAddLinkHeight;

    this.gRowLabels.attr(
      "transform",
      `translate(${x}, ${
        this.columnLabelsHeight + totalMetadataHeight + totalRowAddLinkHeight
      })`,
    );
    // Placing the white background rectangle behind the row labels.
    this.rowLabelsBackground
      .attr("x", x - this.options.marginLeft)
      .attr("y", this.columnLabelsHeight + totalMetadataHeight);
    // Placing the white rectangle to hide column labels in the top left corner.
    this.metadataLabelsBackground.attr("x", x - this.options.marginLeft);
  }

  placeColumnLabelAndMetadataContainers(y: number, transition = false) {
    this.gColumnLabels
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr("transform", `translate(${this.rowLabelsWidth},${y})`);
    this.gColumnMetadata
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr("transform", `translate(0, ${y})`);
    // Placing the white background rectangle behind the column labels and metadata.
    this.columnLabelsBackground
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr("y", y - this.columnLabelsHeight - this.options.marginTop);
    // Placing the white rectangle to hide column labels in the top left corner.
    this.metadataLabelsBackground
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr("y", y - this.columnLabelsHeight - this.options.marginTop);
  }

  placeAddRowLinkContainer(y: number, transition = false) {
    this.gAddRow
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr("transform", `translate(0, ${y})`);
    this.addRowBackground
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr(
        "y",
        y + this.options.columnMetadata.length * this.options.minCellHeight,
      );
  }

  placePinColumnLinkContainer(y: number, transition = false) {
    this.gPinColumn
      .transition()
      .duration(transition ? this.options.transitionDuration : 0)
      .attr("transform", `translate(0, ${y})`);
  }

  processMetadata() {
    // count number of distinct pieces of metadata
    let metadatumCount = 0;
    this.options.columnMetadata.forEach((metadata: $TSFixMe) => {
      const metadataSet = new Set();
      this.columnLabels.forEach((column: $TSFixMe) => {
        const metadatumValue = (column.metadata || {})[metadata.value];
        if (metadatumValue) metadataSet.add(metadatumValue);
      });
      metadatumCount += metadataSet.size;
    });

    const colors = this.options.metadataColorScale.getNScale(metadatumCount);
    let idx = 0;
    this.metadataColors = {};
    this.options.columnMetadata.forEach((metadata: $TSFixMe) => {
      const colorMap = {};

      this.columnLabels.forEach((column: $TSFixMe) => {
        const metadatumValue = (column.metadata || {})[metadata.value];
        if (metadatumValue && !colorMap[metadatumValue]) {
          colorMap[metadatumValue] = colors[idx++];
        }
      });
      this.metadataColors[metadata.value] = colorMap;
    });
  }

  cluster() {
    if (this.options.shouldSortRows) {
      this.sortRows("asc");
    } else if (this.options.clustering) {
      this.clusterRows();
    }

    if (this.columnMetadataSortField) {
      this.columnClustering = null;

      if (this.options.onPinColumnClick) {
        orderBy(
          this.columnLabels,
          [
            // Make sure pinned columns appear first,
            label => label.pinned,
            label => {
              // Pinned columns should not be sorted by the metadata.
              if (!label.pinned) {
                return (
                  (label.metadata &&
                    label.metadata[this.columnMetadataSortField]) ||
                  "ZZZ"
                );
              }
            },
            // Pinned columns in alphabetical order relative to each other.
            label => label.label,
          ],
          ["desc", this.columnMetadataSortAsc ? "asc" : "desc", "asc"],
        ).forEach((label, idx) => {
          label.pos = idx;
        });
      } else {
        orderBy(
          this.columnLabels,
          label => {
            return (
              (label.metadata &&
                label.metadata[this.columnMetadataSortField]) ||
              "ZZZ"
            );
          },
          this.columnMetadataSortAsc ? "asc" : "desc",
        ).forEach((label, idx) => {
          label.pos = idx;
        });
      }
    } else if (this.options.shouldSortColumns) {
      this.sortColumns("asc");
    } else if (this.options.clustering) {
      this.clusterColumns();
    }
  }

  update() {
    this.renderHeatmap();
    this.renderRowLabels();
    this.renderColumnLabels();
    this.renderPinColumnLink();
    this.renderColumnMetadata();
    this.renderRowAddLink(0);

    if (this.options.clustering) {
      this.renderRowDendrogram();
      this.renderColumnDendrogram();
    }

    this.options.onUpdateFinished && this.options.onUpdateFinished();
  }

  getScale() {
    return this.scaleType()
      .domain([this.limits.min, this.limits.max])
      .range([0, 1]);
  }

  getRows(): RowWithIndex[] {
    const scale = this.getScale();
    // getRows and getColumns replace null with option.nullValue
    // might be space-inneficient if the matrix is too sparse
    // alternative is to create a distance function that supports nulls
    const rows = [];
    for (let i = 0; i < this.rowLabels.length; i++) {
      if (!this.rowLabels[i].hidden) {
        const row: RowWithIndex = this.data.values[i].slice();
        for (let j = 0; j < this.columnLabels.length; j++) {
          row[j] = scale(row[j] || this.options.nullValue);
        }
        row.idx = i;
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        rows.push(row);
      }
    }
    return rows;
  }

  getColumns() {
    const scale = this.getScale();
    const columns = [];
    for (let i = 0; i < this.columnLabels.length; i++) {
      for (let j = 0; j < this.rowLabels.length; j++) {
        if (!this.rowLabels[j].hidden) {
          if (!columns[i]) {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            columns[i] = [];
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
            columns[i].idx = i;
          }
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
          columns[i].push(
            scale(this.data.values[j][i] || this.options.nullValue),
          );
        }
      }
    }
    return columns;
  }

  getPinnedColumns() {
    return this.columnLabels.filter((col: $TSFixMe) => col.pinned);
  }

  getUnpinnedColumns() {
    return this.columnLabels.filter((col: $TSFixMe) => !col.pinned);
  }

  getUnpinnedColumnValues() {
    const scale = this.getScale();
    const columns = [];
    for (let i = 0; i < this.columnLabels.length; i++) {
      for (let j = 0; j < this.rowLabels.length; j++) {
        if (!this.rowLabels[j].hidden && !this.columnLabels[i].pinned) {
          if (!columns[i]) {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
            columns[i] = [];
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
            columns[i].idx = i;
          }
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
          columns[i].push(
            scale(this.data.values[j][i] || this.options.nullValue),
          );
        }
      }
    }
    return compact(columns);
  }

  // Get current cursor location from d3 state. This function is called from heatmap components.
  // This removes the need to pass around "d3.event" to get cursor coordinates.
  getCursorLocation() {
    return {
      left: d3.event.pageX,
      top: d3.event.pageY,
    };
  }

  // Get info about the cell the user is currently hovering over. We use this to derive the
  // position of cells that are not rendered (i.e. cells with no data).
  getCellFromCursorLocation() {
    const grid = this.gCells[0][0].getBoundingClientRect();

    // Convert x/y coordinates into row and column positions.
    // Subtract `left` and `top` to account for scrolling of the grid.
    const x = d3.event.clientX - grid.left;
    const y = d3.event.clientY - grid.top;

    // Calculate relative position of the cell
    const xPos = Math.floor((x / grid.width) * this.columnLabels.length);
    const yPos = Math.floor((y / grid.height) * this.rowLabels.length);
    if (xPos < 0 || yPos < 0) return null;

    // Infer row/column index. Note that xPos != columnIndex because rows can be ordered differently
    const columnIndex = find({ pos: xPos }, this.columnLabels).columnIndex;
    const rowIndex = find({ pos: yPos }, this.rowLabels).rowIndex;
    return find({ columnIndex, rowIndex }, this.cells);
  }

  sortTree(root: $TSFixMe) {
    if (!root) return;
    const scale = this.getScale();
    const stack = [];
    while (true) {
      while (root) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        if (root.right) stack.push(root.right);
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        stack.push(root);
        root = root.left;
      }

      root = stack.pop();
      if (root.right && stack[stack.length - 1] === root.right) {
        stack.pop();
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        stack.push(root);
        root = root.right;
      } else {
        if (root.value) {
          root.mean = mean(root.value.map((d: $TSFixMe) => scale(d)));
        } else {
          if (root.left.mean < root.right.mean) {
            [root.left, root.right] = [root.right, root.left];
          }
          root.mean = root.left.mean;
        }

        root = null;
      }
      if (!stack.length) {
        break;
      }
    }
  }

  getDepth(root: $TSFixMe) {
    if (!root) return 0;
    const stack = [[root, 0]];
    let maxDepth = 0;
    while (stack.length) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2488
      const [node, depth] = stack.pop();
      maxDepth = depth > maxDepth ? depth : maxDepth;
      if (node.left) stack.push([node.left, depth + 1]);
      if (node.right) stack.push([node.right, depth + 1]);
    }

    return maxDepth;
  }

  setOrder(root: $TSFixMe, labels: $TSFixMe, offset = 0) {
    const stack = [];

    let done = false;
    let pos = offset;
    while (!done) {
      if (root) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        stack.push(root);
        root = root.left;
      } else {
        if (stack.length) {
          root = stack.pop();
          if (root.value) {
            labels[root.value.idx].pos = pos++;
          }
          root = root.right;
        } else {
          done = true;
        }
      }
    }

    return labels;
  }

  clusterRows() {
    const rows = this.getRows();
    this.rowClustering = Cluster.hcluster(rows);

    this.sortTree(this.rowClustering);
    this.setOrder(this.rowClustering, this.rowLabels);
  }

  unpinColumn = (column: $TSFixMe) => {
    this.options.onUnpinColumn && this.options.onUnpinColumn(column.id);
  };

  clusterColumns() {
    if (this.options.onPinColumnClick) {
      // Make sure pinnned columns appear first, in alphabetical order.
      orderBy(
        this.columnLabels,
        [label => label.pinned, label => label.label],
        ["desc", "asc"],
      ).forEach((label, idx) => {
        label.pos = idx;
      });

      // Cluster the remaining unpinned columns.
      const unpinnedColumnValues = this.getUnpinnedColumnValues();
      this.columnClustering = Cluster.hcluster(unpinnedColumnValues);
      this.sortTree(this.columnClustering);
      this.setOrder(
        this.columnClustering,
        this.columnLabels,
        this.getPinnedColumns().length,
      );
    } else {
      const columns = this.getColumns();
      this.columnClustering = Cluster.hcluster(columns);
      this.sortTree(this.columnClustering);
      this.setOrder(this.columnClustering, this.columnLabels);
    }
  }

  // Re-sorts the columns. The rendered order of columns is determined solely by
  // the `pos` property of each columnLabel.
  sortColumns(direction: $TSFixMe) {
    this.columnClustering = null;

    if (this.options.onPinColumnClick) {
      orderBy(
        this.columnLabels,
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        [label => label.pinned, label => label.label],
        ["desc", direction],
      ).forEach((label, idx) => {
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        label.pos = idx;
      });
    } else {
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      orderBy(this.columnLabels, label => label.label, direction).forEach(
        (label, idx) => {
          // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
          label.pos = idx;
        },
      );
    }
  }

  // Re-sorts the rows. The rendered order of rows is determined solely by
  // the `pos` property of each filteredRowLabel.
  sortRows(direction: $TSFixMe) {
    this.rowClustering = null;

    orderBy(
      this.filteredRowLabels,
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      label => label.sortKey || label.label,
      direction,
    );
    this.filteredRowLabels.forEach((label: $TSFixMe, idx: $TSFixMe) => {
      label.pos = idx;
    });
  }

  range(n: $TSFixMe) {
    // eslint-disable-next-line prefer-spread
    return Array.apply(null, { length: n }).map(Number.call, Number);
  }

  download(toggleFullNames: (status?: "truncated") => void) {
    this.expandColumnLabels();
    // pausing to let the svg rerender
    setTimeout(() => {
      this.svg.classed(cs.printMode, true);
      this.showPrintCaption();
      this.svgSaver.asSvg(this.svg.node(), "heatmap.svg");
      this.svg.classed(cs.printMode, false);
      toggleFullNames("truncated");
      this.hidePrintCaption();
    }, 100);
  }

  downloadAsPng(toggleFullNames: (status?: "truncated") => void) {
    this.expandColumnLabels();
    // pausing to let the svg rerender
    setTimeout(() => {
      this.svg.classed(cs.printMode, true);
      this.showPrintCaption();
      this.svgSaver.asPng(this.svg.node(), "heatmap.png");
      this.svg.classed(cs.printMode, false);
      toggleFullNames("truncated");
      this.hidePrintCaption();
    }, 100);
  }

  computeCurrentHeatmapViewValuesForCSV({ headers = [] }) {
    const csvHeaders = [...headers];
    let csvRows: $TSFixMe = [];

    const sortedRows = sortBy(["pos"], this.rowLabels);
    const sortedColumns = sortBy(["pos"], this.columnLabels);

    sortedRows.forEach(row =>
      csvRows.push([
        row.label,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        ...(headers.includes("Genus") ? [row.genusName] : []),
      ]),
    );

    sortedColumns.forEach(column => {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      csvHeaders.push(column.label);

      sortedRows.forEach(row => {
        const { columnIndex } = column;
        const { rowIndex } = row;
        const cell = find({ columnIndex, rowIndex }, this.filteredCells);

        // this.filteredCells contains cells where the row has not been hidden
        // (i.e. rowLabels entry hidden = false).  Despite the naming, user applied
        // filter on the heatmap are not taken into account
        let cellVal;

        // cells with a 0 value are not present in this.filteredCells
        if (!cell) {
          cellVal = 0;
        } else {
          cellVal = cell.meetsUserFilters ? cell.value : "NA";
        }

        csvRows[row.pos].push(cellVal);
      });
    });

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    csvRows = csvRows.map(row => [sanitizeCSVRow(row).join()]);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return [[sanitizeCSVRow(csvHeaders).join()], csvRows];
  }

  showPrintCaption = () => {
    const totalCaptionHeight = this.options.printCaption
      ? this.options.printCaption.length * (this.options.captionLineHeight + 1)
      : 0;

    // This assumes that this.height contains the "normal" height of the heatmap.
    // We temporarily change the svg height to add the caption, and will revert it as
    // soon as the printing is done.
    this.svg.attr(
      "height",
      (this.height + totalCaptionHeight) * this.options.zoom,
    );
    this.renderCaption();
  };

  hidePrintCaption = () => {
    // Revert the svg to its previous height, without the caption.
    this.svg.attr("height", this.height * this.options.zoom);

    // Remove all captions.
    this.gCaption.selectAll(`.${cs.caption}`).remove();

    // if we modified the column labels to show the full names for the printing process
    // revert them back to the truncated names
  };

  expandColumnLabels = () => {
    // get the full names from the printLabel key and updateData with the full names
    this.updateData({
      columnLabels: this.columnLabels.map(columnLabel => {
        return { ...columnLabel, label: columnLabel.printLabel };
      }),
    });
  };

  removeRow = (row: $TSFixMe) => {
    // Clear out any row/col highlighting overlays before we remove the row
    this.clearOverlays();

    // Remove the row
    this.options.onRemoveRow && this.options.onRemoveRow(row.label);
    delete row.pos;
    row.hidden = true;
    this.processData("filter");
  };

  handleRowLabelMouseEnter = (rowLabelEntered: $TSFixMe) => {
    this.updateLabelHighlights(
      this.gRowLabels.selectAll(`.${cs.rowLabel}`),
      this.rowLabels,
    );
    this.highlightRowOrColumn(rowLabelEntered);

    if (this.rowClustering) return;

    // This means that rowLabelHover gets applied if the sortKey (if any)
    // matches the rowLabelEntered:
    this.gRowLabels
      .selectAll(`.${cs.rowLabel}`)
      .classed(
        cs.rowLabelHover,
        (row: $TSFixMe) =>
          row.sortKey && row.sortKey === rowLabelEntered.sortKey,
      );

    const currentGroup = this.gRowLabels.selectAll(
      `.${cs.rowLabel}.${cs.rowLabelHover}`,
    );
    const firstElem = currentGroup[0][0];

    // If there's no firstElem, that means rowLabelHover was not applied to any
    // row:
    !!firstElem &&
      this.options.onRowGroupEnter &&
      this.options.onRowGroupEnter(
        rowLabelEntered,
        firstElem.getBoundingClientRect(),
        this.gColumnMetadata.node().getBoundingClientRect().bottom,
      );
  };

  handleRowLabelMouseLeave = (rowLabelLeft: $TSFixMe) => {
    this.updateLabelHighlights(
      this.gRowLabels.selectAll(`.${cs.rowLabel}`),
      this.rowLabels,
    );
    this.highlightRowOrColumn(null);

    if (this.rowClustering) return;
    this.gRowLabels
      .selectAll(`.${cs.rowLabel}`)
      .classed(cs.rowLabelHover, false);

    this.options.onRowGroupLeave && this.options.onRowGroupLeave(rowLabelLeft);
  };

  handleColumnLabelMouseEnter = (columnLabelEntered: $TSFixMe) => {
    this.updateLabelHighlights(
      this.gColumnLabels.selectAll(`.${cs.columnLabel}`),
      this.columnLabels,
    );
    this.highlightRowOrColumn(columnLabelEntered);
  };

  handleColumnLabelMouseLeave = () => {
    this.updateLabelHighlights(
      this.gColumnLabels.selectAll(`.${cs.columnLabel}`),
      this.columnLabels,
    );
    this.highlightRowOrColumn(null);
  };

  handleColumnMetadataLabelClick(value: $TSFixMe) {
    const { onColumnMetadataSortChange } = this.options;
    if (this.columnMetadataSortField === value) {
      if (this.columnMetadataSortAsc) {
        this.columnMetadataSortAsc = false;
      } else {
        this.columnMetadataSortField = null;
        this.columnMetadataSortAsc = true;
      }
    } else {
      this.columnMetadataSortField = value;
      this.columnMetadataSortAsc = true;
    }

    this.processData("cluster");
    onColumnMetadataSortChange &&
      onColumnMetadataSortChange(
        this.columnMetadataSortField,
        this.columnMetadataSortAsc,
      );
  }

  handleCellMouseOver = (d: $TSFixMe) => {
    // Highlight cell user hovered over
    this.gCellHover
      .attr("visibility", "visible")
      .attr("x", this.columnLabels[d.columnIndex].pos * this.cell.width)
      .attr("y", this.rowLabels[d.rowIndex].pos * this.cell.height);

    // Highlight this cell's row/column labels
    this.rowLabels[d.rowIndex].highlighted = true;
    this.columnLabels[d.columnIndex].highlighted = true;
    this.updateLabelHighlights(
      this.gRowLabels.selectAll(`.${cs.rowLabel}`),
      this.rowLabels,
    );
    this.updateLabelHighlights(
      this.gColumnLabels.selectAll(`.${cs.columnLabel}`),
      this.columnLabels,
    );

    this.options.onNodeHover && this.options.onNodeHover(d);
  };

  handleCellMouseLeave = (d: $TSFixMe) => {
    // Stop highlighting cell
    this.gCellHover.attr("visibility", "hidden");

    // Stop highlighting this cell's row/column labels
    this.rowLabels[d.rowIndex].highlighted = false;
    this.columnLabels[d.columnIndex].highlighted = false;
    this.updateLabelHighlights(
      this.gRowLabels.selectAll(`.${cs.rowLabel}`),
      this.rowLabels,
    );
    this.updateLabelHighlights(
      this.gColumnLabels.selectAll(`.${cs.columnLabel}`),
      this.columnLabels,
    );

    this.options.onNodeHoverOut && this.options.onNodeHoverOut(d);
  };

  handleCellClick = (d: $TSFixMe) => {
    this.options.onCellClick && this.options.onCellClick(d, d3.event);
  };

  applyScale(scale: $TSFixMe, value: $TSFixMe, min: $TSFixMe, max: $TSFixMe) {
    value = Math.min(Math.max(value, min), max);
    return Math.round(scale(value));
  }

  cellYPosition(d: $TSFixMe) {
    return d.pos * this.cell.height;
  }

  renderHeatmap() {
    const colorScale = this.scaleType()
      .domain([this.scaleLimits.min, this.scaleLimits.max])
      .range([0, this.options.colors.length - 1]);

    const applyFormat = (nodes: $TSFixMe) => {
      nodes
        .attr("width", this.cell.width - 2)
        .attr("height", this.cell.height - 2)
        .attr(
          "x",
          (d: $TSFixMe) =>
            this.columnLabels[d.columnIndex].pos * this.cell.width + 1,
        )
        .attr(
          "y",
          (d: $TSFixMe) => this.cellYPosition(this.rowLabels[d.rowIndex]) + 1,
        )
        .style("fill", (d: $TSFixMe) => {
          if (!d.value && d.value !== 0) {
            return this.options.colorNoValue;
          }
          const colorIndex = this.applyScale(
            colorScale,
            d.value,
            this.scaleLimits.min,
            this.scaleLimits.max,
          );
          return this.options.customColorCallback
            ? this.options.customColorCallback(
                d.value,
                d,
                this.options.colors[colorIndex],
                this.options.colors,
                this.options.colorNoValue,
              )
            : this.options.colors[colorIndex];
        });
    };

    // Define background pattern
    if (this.bgPattern) this.bgPattern.remove();
    this.bgPattern = this.defs
      .append("pattern")
      .attr("id", "pattern-grid")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", this.cell.width)
      .attr("height", this.cell.height);
    this.bgPattern
      .append("rect")
      .style("fill", "rgb(234, 234, 234)")
      .attr("height", this.cell.height - 2)
      .attr("width", this.cell.width - 2)
      .attr("x", 1)
      .attr("y", 1);

    // Render background grid with pattern created above
    const totalCellWidth = this.cell.width * this.columnLabels.length;
    const totalCellHeight = this.cell.height * this.filteredRowLabels.length;
    if (this.bgGrid != null) this.bgGrid.remove();
    this.bgGrid = this.gCells.append("rect").lower();
    this.bgGrid
      .attr("width", totalCellWidth)
      .attr("height", totalCellHeight)
      .attr("style", "fill: url(#pattern-grid)")
      .on("mousemove", () => {
        // Update tooltip on "mousemove", not "mouseover" because you can hover over many cells in that grid
        const cell = this.getCellFromCursorLocation();
        if (!cell) return;

        // Update the tooltip only if we hover over a new cell, otherwise, the tooltip would follow the cursor,
        // which is not how the rest of the cells behave.
        if (!isEqual(this.previousNullHover, cell)) {
          if (this.previousNullHover)
            this.handleCellMouseLeave(this.previousNullHover);
          this.previousNullHover = cell;
          this.handleCellMouseOver(cell);
        }
      })
      .on("mouseleave", () => {
        // Need this, otherwise if hover over null then hover over data, old highlightings still there!
        if (this.previousNullHover) {
          this.handleCellMouseLeave(this.previousNullHover);
          this.previousNullHover = null;
        }
      })
      .on("click", () => {
        const cell = this.getCellFromCursorLocation();
        if (!cell) return;
        this.handleCellClick(cell);
      });

    // Draw a rectangle that will be used as a border when hovering over cells. We do this
    // because cells are not rendered if they don't have data, but we still want to see a
    // border when hovering around those cells.
    if (this.gCellHover) this.gCellHover.remove();
    this.gCellHover = this.gCells.append("rect").lower();
    this.gCellHover
      .style("fill-opacity", 0)
      .style("stroke", COLOR_HOVER_LINK)
      .attr("height", this.cell.height)
      .attr("width", this.cell.width)
      .attr("visibility", "hidden");

    // Render cells
    const cells = this.gCells
      .selectAll(`.${cs.cell}`)
      .data(this.filteredCells, (d: $TSFixMe) => d.id);

    cells
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    const cellsUpdate = cells
      .transition()
      .duration(this.options.transitionDuration);
    applyFormat(cellsUpdate);

    const cellsEnter = cells
      .enter()
      .append("rect")
      .attr("class", () => cs.cell)
      .on("mouseover", this.handleCellMouseOver)
      .on("mouseleave", this.handleCellMouseLeave)
      .on("click", this.handleCellClick);
    applyFormat(cellsEnter);
  }

  renderRowLabels() {
    const applyFormat = (nodes: $TSFixMe) => {
      nodes.attr(
        "transform",
        (d: $TSFixMe) => `translate(0, ${this.cellYPosition(d)})`,
      );

      // Update position of row labels
      nodes.select("rect").attr("width", this.rowLabelsWidth);
      nodes
        .select("text")
        .attr("data-testid", "row-label")
        .attr(
          "transform",
          `translate(${this.rowLabelsWidth - this.options.spacing}, ${
            this.cell.height / 2
          })`,
        );
    };

    // hides genus separators in cluster mode
    this.gRowLabels.classed(cs.rowClustering, this.rowClustering);

    const rowLabel = this.gRowLabels
      .selectAll(`.${cs.rowLabel}`)
      .data(this.filteredRowLabels, (d: $TSFixMe) => d.label)
      .order();

    rowLabel
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    const rowLabelUpdate = rowLabel
      .transition()
      .duration(this.options.transitionDuration);
    applyFormat(rowLabelUpdate);

    const rowLabelEnter = rowLabel
      .enter()
      .append("g")
      .attr("class", cs.rowLabel)
      .on("mouseenter", this.handleRowLabelMouseEnter)
      .on("mouseleave", this.handleRowLabelMouseLeave);

    rowLabelEnter
      .append("rect")
      .attr("class", cs.hoverTarget)
      .attr("width", this.rowLabelsWidth)
      .attr("height", this.cell.height)
      .style(TEXT_ANCHOR, "end");

    rowLabelEnter
      .append("text")
      .text((d: $TSFixMe) => d.label)
      .style("dominant-baseline", "central")
      .style(TEXT_ANCHOR, "end")
      .on(
        "click",
        (d: $TSFixMe) =>
          this.options.onRowLabelClick &&
          this.options.onRowLabelClick(d.label, d3.event),
      );
    applyFormat(rowLabelEnter);

    rowLabelEnter
      .append("line")
      .attr("x1", 0)
      .attr("x2", this.rowLabelsWidth)
      .attr("y1", this.cell.height)
      .attr("y2", this.cell.height)
      .attr("class", cs.genusBorder)
      .classed(cs.hideGenusBorder, (label: $TSFixMe, i: $TSFixMe) => {
        const nextLabel = this.filteredRowLabels[i + 1];
        if (nextLabel) {
          return label.sortKey === nextLabel.sortKey;
        } else {
          // hide line at very bottom
          return true;
        }
      });

    rowLabelEnter
      .append("svg:image")
      .attr("class", cs.removeIcon)
      .attr("width", this.options.spacing)
      .attr("height", this.options.spacing)
      .attr(
        "transform",
        `translate(${this.options.spacing},
        ${(this.cell.height - this.options.spacing) / 2})`,
      )
      .attr(XLINK_HREF, `${this.options.iconPath}/IconCloseSmall.svg`)
      .on("click", this.removeRow);

    applyFormat(rowLabelEnter);
  }

  renderRowAddLink(dx: $TSFixMe) {
    if (this.options.onAddRowClick) {
      const handleAddRowClick = () => {
        this.options.onAddRowClick(addRowTrigger.node(), {
          x: this.rowLabelsWidth - 10,
          y: yPos,
        });
      };

      const addLink = this.gAddRow
        .selectAll(`.${cs.columnMetadataAdd}`)
        .data([1]);

      const applyFormat = (nodes: $TSFixMe) => {
        nodes
          .select("text")
          .attr("x", this.rowLabelsWidth - this.options.marginAddLink);
        nodes
          .select("image")
          .attr("x", this.rowLabelsWidth - this.options.marginAddLinkImg);
      };

      // Update elements that changed
      const addLinkUpdate = addLink
        .transition()
        .duration(this.options.transitionDuration);
      applyFormat(addLinkUpdate);

      const addLinkEnter = addLink
        .enter()
        .append("g")
        .attr("class", cs.columnMetadataAdd);

      const yPos = this.options.metadataAddLinkHeight / 2;

      addLinkEnter.append("rect");

      addLinkEnter
        .append("text")
        .text(() => "Add Taxon")
        .attr("class", cs.metadataAddLabel)
        .attr("y", 11)
        .on("click", handleAddRowClick);
      applyFormat(addLinkEnter);

      const addRowTrigger = addLinkEnter
        .append("g")
        .attr("class", cs.metadataAddTrigger)
        .on("click", handleAddRowClick);

      addRowTrigger
        .append("svg:image")
        .attr("class", cs.metadataAddIcon)
        .attr("width", this.options.metadataAddLinkHeight)
        .attr("height", this.options.metadataAddLinkHeight)
        .attr(XLINK_HREF, `${this.options.iconPath}/plus.svg`);
      applyFormat(addRowTrigger);

      // setup triggers
      if (addRowTrigger.size()) {
        this.addRowTrigger = addRowTrigger.node();
      }

      // update
      addLink.attr(
        "transform",
        `translate(${dx}, ${
          (1 + this.options.columnMetadata.length) * this.options.minCellHeight
        })`,
      );

      addLink
        .select("rect")
        .attr(
          "width",
          this.rowLabelsWidth + this.columnLabels.length * this.cell.width,
        )
        .attr("height", this.options.metadataAddLinkHeight);
    }
  }

  renderPinColumnLink(dx = 0) {
    if (this.options.onPinColumnClick) {
      const handlePinColumnClick = () => {
        this.options.onPinColumnClick(pinColumnTrigger.node(), {
          x: this.rowLabelsWidth - 10,
          y: yPos,
        });
      };

      const applyFormat = (nodes: $TSFixMe) => {
        nodes
          .select("text")
          .attr("x", this.rowLabelsWidth - this.options.marginAddLink);
        nodes
          .select("image")
          .attr("x", this.rowLabelsWidth - this.options.marginAddLinkImg);
        nodes
          .select("rect")
          .attr(
            "width",
            this.rowLabelsWidth + this.columnLabels.length * this.cell.width,
          )
          .attr("height", this.options.metadataAddLinkHeight);
      };

      const addLink = this.gPinColumn
        .selectAll(`.${cs.columnMetadataAdd}`)
        .data([1]);

      // Update elements that changed
      const addLinkUpdate = addLink
        .transition()
        .duration(this.options.transitionDuration);
      applyFormat(addLinkUpdate);

      const addLinkEnter = addLink
        .enter()
        .append("g")
        .attr("class", cs.columnMetadataAdd);

      const yPos = this.options.metadataAddLinkHeight / 2;

      addLinkEnter.append("rect");

      addLinkEnter
        .append("text")
        .text(() => "Pin Samples")
        .attr("class", cs.metadataAddLabel)
        .attr("y", 11)
        .on("click", handlePinColumnClick);
      applyFormat(addLinkEnter);

      const pinColumnTrigger = addLinkEnter
        .append("g")
        .attr("class", cs.metadataAddTrigger)
        .on("click", handlePinColumnClick);

      pinColumnTrigger
        .append("svg:image")
        .attr("class", cs.metadataAddIcon)
        .attr("width", this.options.metadataAddLinkHeight)
        .attr("height", this.options.metadataAddLinkHeight)
        .attr(XLINK_HREF, `${this.options.iconPath}/plus.svg`);
      applyFormat(pinColumnTrigger);

      // setup triggers
      if (pinColumnTrigger.size()) {
        this.pinColumnTrigger = pinColumnTrigger.node();
      }

      // update
      addLink.attr(
        "transform",
        `translate(${dx}, ${-this.options.metadataAddLinkHeight * 2})`,
      );
    }
  }

  renderColumnLabels() {
    this.gColumnLabels.selectAll("*").remove();

    const columnLabel = this.gColumnLabels
      .selectAll(`.${cs.columnLabel}`)
      .data(this.columnLabels, (d: $TSFixMe) => d.id);

    const columnLabelUpdate = columnLabel
      .transition()
      .duration(this.options.transitionDuration);

    const applyFormat = (nodes: $TSFixMe) => {
      nodes.attr("transform", (d: $TSFixMe) => {
        return `translate(${d.pos * this.cell.width},-${this.options.spacing})`;
      });
    };

    applyFormat(columnLabelUpdate);

    const columnLabelEnter = columnLabel
      .enter()
      .append("g")
      .attr("class", cs.columnLabel)
      .on("mouseenter", this.handleColumnLabelMouseEnter)
      .on("mouseleave", this.handleColumnLabelMouseLeave);

    columnLabelEnter
      .append("text")
      .text((d: $TSFixMe) => d.label)
      .style(TEXT_ANCHOR, "left")
      .attr(
        "transform",
        `translate(${this.cell.width / 2},-${this.options.spacing}) rotate (${
          this.options.textRotation
        })`,
      )
      .on("mousein", this.options.onColumnLabelMouseIn)
      .on("mouseout", this.options.onColumnLabelMouseOut)
      .on("mouseover", (d: $TSFixMe) => {
        this.options.onColumnLabelHover && this.options.onColumnLabelHover(d);
      })
      .on("mouseleave", this.options.onColumnLabelOut)
      .on(
        "click",
        (d: dProps) =>
          this.options.onColumnLabelClick &&
          this.options.onColumnLabelClick(d.id, d3.event),
      );

    columnLabelEnter
      .append("svg:image")
      .attr("class", cs.pinIcon)
      // Center the icon in the column, offset by the half the icon width.
      .attr("transform", `translate(${this.cell.width / 2 - 7}, 0)`)
      .attr(XLINK_HREF, `${this.options.iconPath}/IconPin.svg`)
      .on("mouseenter", this.options.onPinIconHover)
      .on("mouseleave", this.options.onPinIconExit)
      .on("click", this.unpinColumn);

    applyFormat(columnLabelEnter);

    // Only display the pin icon if the column is pinned.
    columnLabel.select(`.${cs.pinIcon}`).attr("display", (d: $TSFixMe) => {
      if (d.pinned) {
        return "default";
      } else {
        return "none";
      }
    });
  }

  renderColumnMetadata(dx = 0, transition = true) {
    this.renderColumnMetadataCells();
    this.renderColumnMetadataAddLink(dx);
    this.renderColumnMetadataLabels(dx, transition);
  }

  getColumnMetadataLabelOffset(d: $TSFixMe) {
    return d.value === this.columnMetadataSortField
      ? this.options.metadataSortIconSize + this.options.spacing
      : 0;
  }

  renderColumnMetadataLabels(dx: $TSFixMe, transition = true) {
    const applyFormat = (nodes: $TSFixMe) => {
      nodes.attr("transform", (d: $TSFixMe, idx: $TSFixMe) => {
        const xOffset = this.getColumnMetadataLabelOffset(d);
        return `translate(${dx - xOffset}, ${
          this.options.metadataAddLinkHeight +
          (1 + idx * this.options.minCellHeight)
        })`;
      });

      // Update metadata name
      nodes
        .select("text")
        .attr(
          "transform",
          `translate(${this.rowLabelsWidth - this.options.spacing}, ${
            this.options.minCellHeight / 2
          })`,
        );
      // Update rect use as a hover target
      nodes.select("rect").attr("width", (d: $TSFixMe) => {
        const xOffset = this.getColumnMetadataLabelOffset(d);
        return this.rowLabelsWidth + this.options.marginLeft + xOffset;
      });
      // Update sort icon
      nodes
        .select("image")
        .attr(
          "transform",
          `translate(${this.rowLabelsWidth},${
            (this.options.minCellHeight + this.options.metadataSortIconSize) / 2
          })`,
        );
    };

    const columnMetadataLabel = this.gColumnMetadata
      .selectAll(`.${cs.columnMetadataLabel}`)
      .data(this.options.columnMetadata, (d: $TSFixMe) => d.value);

    columnMetadataLabel
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    const columnMetadataLabelUpdate = columnMetadataLabel
      .transition()
      .duration(this.options.transitionDuration);

    if (!transition) {
      applyFormat(columnMetadataLabel);
    } else {
      applyFormat(columnMetadataLabelUpdate);
    }

    const columnMetadataLabelEnter = columnMetadataLabel
      .enter()
      .append("g")
      .attr("class", cs.columnMetadataLabel)
      .on("mousein", this.options.onColumnMetadataLabelMouseIn)
      .on("mouseout", this.options.onColumnMetadataLabelMouseOut);

    columnMetadataLabelEnter
      .append("rect")
      .attr("class", cs.hoverTarget)
      .attr("x", -this.options.marginLeft)
      .attr("y", -1)
      .attr("height", this.options.minCellHeight + 1)
      .style(TEXT_ANCHOR, "end")
      .style("fill", "white");
    applyFormat(columnMetadataLabelEnter);

    const handleColumnMetadataLabelClick = (d: $TSFixMe) => {
      this.options.onColumnMetadataLabelClick
        ? this.options.onColumnMetadataLabelClick(d.value, d3.event)
        : this.handleColumnMetadataLabelClick(d.value);

      columnMetadataLabelEnter
        .selectAll("rect")
        .attr("width", (d: $TSFixMe) => {
          const xOffset = this.getColumnMetadataLabelOffset(d);
          return this.rowLabelsWidth + this.options.marginLeft + xOffset;
        });
    };

    columnMetadataLabelEnter
      .append("text")
      .text((d: $TSFixMe) => d.label)
      .style("dominant-baseline", "central")
      .style(TEXT_ANCHOR, "end")
      .on("click", handleColumnMetadataLabelClick)
      .on("mouseover", (d: $TSFixMe) => {
        this.options.onColumnMetadataLabelHover &&
          this.options.onColumnMetadataLabelHover(d);
      })
      .on("mouseleave", (d: $TSFixMe) => {
        this.options.onColumnMetadataLabelOut &&
          this.options.onColumnMetadataLabelOut(d);
      });
    applyFormat(columnMetadataLabelEnter);

    columnMetadataLabelEnter
      .append("g")
      .append("svg:image")
      .attr("class", "metadataSortIcon")
      .attr("width", this.options.metadataSortIconSize)
      .attr("height", this.options.metadataSortIconSize)
      .attr("transform", "rotate(-90)")
      .on("click", handleColumnMetadataLabelClick);
    applyFormat(columnMetadataLabelEnter);

    columnMetadataLabel
      .select(".metadataSortIcon")
      .attr(XLINK_HREF, (d: $TSFixMe) =>
        d.value === this.columnMetadataSortField
          ? `${this.options.iconPath}/sort_${
              this.columnMetadataSortAsc ? "asc" : "desc"
            }.svg`
          : "",
      );
  }

  renderColumnMetadataCells() {
    const applyFormatForCells = (nodes: $TSFixMe) => {
      nodes
        .attr("width", this.cell.width - 2)
        .attr("height", this.options.minCellHeight - 2)
        .attr(
          "transform",
          (d: $TSFixMe) =>
            `translate(${
              d.pos * this.cell.width + this.rowLabelsWidth + 1
            }, 0)`,
        );
    };

    const applyFormatForRows = (nodes: $TSFixMe) => {
      nodes.attr(
        "transform",
        (_: $TSFixMe, i: $TSFixMe) =>
          `translate(0, ${
            this.options.metadataAddLinkHeight + this.options.minCellHeight * i
          })`,
      );
    };

    const columnnMetadataCells = this.gColumnMetadata
      .selectAll(".columnMetadataCells")
      .data(this.options.columnMetadata, (d: $TSFixMe) => d.value);

    columnnMetadataCells
      .exit()
      .lower()
      .transition()
      .duration(this.options.transitionDuration)
      .style("opacity", 0)
      .remove();

    const rowsUpdate = columnnMetadataCells
      .transition()
      .duration(this.options.transitionDuration);
    applyFormatForRows(rowsUpdate);

    const rowsEnter = columnnMetadataCells
      .enter()
      .append("g")
      .attr("class", (d: $TSFixMe) =>
        cx("columnMetadataCells", d.value.replace(/ /g, "_")),
      );
    applyFormatForRows(rowsEnter);

    this.options.columnMetadata.forEach((metadata: $TSFixMe) => {
      const columnMetadataCell = this.gColumnMetadata
        .select(
          `.columnMetadataCells.${CSS.escape(
            metadata.value.replace(/ /g, "_"),
          )}`,
        )
        .selectAll(".columnMetadataCell")
        .data(this.columnLabels, (d: $TSFixMe) => d.id);

      columnMetadataCell
        .exit()
        .lower()
        .transition()
        .duration(this.options.transitionDuration)
        .style("opacity", 0)
        .remove();

      const columnMetadataCellUpdate = columnMetadataCell
        .transition()
        .duration(this.options.transitionDuration);
      applyFormatForCells(columnMetadataCellUpdate);

      const columnMetadataCellEnter = columnMetadataCell
        .enter()
        .append("rect")
        .attr("class", "columnMetadataCell")
        .on("mouseover", (d: $TSFixMe) => {
          this.options.onMetadataNodeHover &&
            this.options.onMetadataNodeHover(d, metadata);
        })
        .on("mouseleave", (d: $TSFixMe) => {
          // use same hover out handler because we want the same behavior
          this.options.onColumnMetadataLabelOut &&
            this.options.onColumnMetadataLabelOut(d);
        });

      columnMetadataCell.style("fill", (d: $TSFixMe) => {
        const metadataValue = d.metadata[metadata.value];
        return metadataValue
          ? this.metadataColors[metadata.value][metadataValue]
          : this.options.colorNoValue;
      });
      applyFormatForCells(columnMetadataCellEnter);
    });
  }

  renderColumnMetadataAddLink(dx: $TSFixMe) {
    if (this.options.onAddColumnMetadataClick) {
      const handleAddColumnMetadataClick = () => {
        this.options.onAddColumnMetadataClick(addMetadataTrigger.node(), {
          x: this.rowLabelsWidth - 10,
          y: yPos,
        });
      };

      const addLink = this.gColumnMetadata
        .selectAll(`.${cs.columnMetadataAdd}`)
        .data([1]);

      const applyFormat = (nodes: $TSFixMe) => {
        nodes.select("rect").attr("width", this.rowLabelsWidth);
        nodes
          .select("text")
          .attr("x", this.rowLabelsWidth - this.options.marginAddLink);
        nodes
          .select("image")
          .attr("x", this.rowLabelsWidth - this.options.marginAddLinkImg);
      };

      // Update elements that changed
      const addLinkUpdate = addLink
        .transition()
        .duration(this.options.transitionDuration);
      applyFormat(addLinkUpdate);

      const addLinkEnter = addLink
        .enter()
        .append("g")
        .attr("class", cs.columnMetadataAdd);

      const yPos = this.options.metadataAddLinkHeight / 2;

      addLinkEnter.append("rect");

      addLinkEnter
        .append("text")
        .text(() => "Add Metadata")
        .attr("class", cs.metadataAddLabel)
        .attr("y", 11)
        .on("click", handleAddColumnMetadataClick);
      applyFormat(addLinkEnter);

      const addMetadataTrigger = addLinkEnter
        .append("g")
        .attr("class", cs.metadataAddTrigger)
        .on("click", handleAddColumnMetadataClick);

      addMetadataTrigger
        .append("svg:image")
        .attr("class", cs.metadataAddIcon)
        .attr("width", this.options.metadataAddLinkHeight)
        .attr("height", this.options.metadataAddLinkHeight)
        .attr(XLINK_HREF, `${this.options.iconPath}/plus.svg`);
      applyFormat(addMetadataTrigger);

      // setup triggers
      if (addMetadataTrigger.size()) {
        this.addMetadataTrigger = addMetadataTrigger.node();
      }

      // update
      addLink.attr("transform", `translate(${dx}, 0)`);
    }
  }

  // Dendograms
  renderColumnDendrogram() {
    this.gColumnDendogram.select("g").remove();
    const container = this.gColumnDendogram.append("g");
    if (this.columnClustering) {
      const numColumns = this.options.onPinColumnClick
        ? this.getUnpinnedColumns().length
        : this.columnLabels.length;
      const width = this.cell.width * numColumns;
      const height = this.columnClusterHeight - this.options.spacing;

      this.renderDendrogram(
        container,
        this.columnClustering,
        this.columnLabels,
        width,
        height,
      );

      const offset = this.options.onPinColumnClick
        ? this.cell.width * this.getPinnedColumns().length
        : 0;
      container.attr(
        "transform",
        `rotate(-90) translate(-${height + this.options.spacing},${offset})`,
      );
    }
  }

  renderRowDendrogram() {
    const height = this.rowClusterWidth - 10;
    const width = this.cell.height * this.filteredRowLabels.length;

    this.gRowDendogram.select("g").remove();
    const container = this.gRowDendogram.append("g");
    if (this.rowClustering) {
      this.renderDendrogram(
        container,
        this.rowClustering,
        this.rowLabels,
        width,
        height,
      );
      container.attr(
        "transform",
        `scale(-1,1) translate(-${this.rowClusterWidth},0)`,
      );
    }
  }

  renderCaption() {
    const caption = this.gCaption
      .selectAll(`.${cs.caption}`)
      .data(this.options.printCaption);

    caption
      .enter()
      .append("text")
      .attr("class", cs.caption)
      .text((d: $TSFixMe) => d)
      .attr(
        "transform",
        (_: $TSFixMe, idx: $TSFixMe) =>
          `translate(0, ${idx * this.options.captionLineHeight})`,
      );
  }

  // Highlight a row or column. The `nbCells` determines how many cells-wide the
  // highlighted region should be (it's > 1 for dendrogram hovers).
  highlightRowOrColumn(rowOrColumn: $TSFixMe, nbCells = 1) {
    // Add debouncing logic before we clear the overlays. That way, if the user
    // hovers quickly across rows/columns on a large heatmap, it won't flicker.
    if (!rowOrColumn) {
      this.overlaysDebounce = true;
      setTimeout(() => {
        if (this.overlaysDebounce) this.clearOverlays();
      }, 100);
      return;
    }

    // Clear previous overlays
    this.overlaysDebounce = false;
    this.clearOverlays();
    const pos = rowOrColumn.pos;

    // Highlight column
    if (rowOrColumn.columnIndex != null) {
      // Create overlay rectangle to the left of the highlighted column
      this.createOverlay({
        x: 0,
        y: 0,
        width: this.cell.width * pos,
        height: this.height,
      });

      // Create overlay rectangle to the right of the highlighted column
      this.createOverlay({
        x: this.cell.width * (pos + nbCells),
        y: 0,
        width: this.cell.width * (this.columnLabels.length - pos - nbCells),
        height: this.height,
      });

      // Highlight row
    } else if (rowOrColumn.rowIndex != null) {
      // Create overlay rectangle above the highlighted row
      this.createOverlay({
        x: 0,
        y: 0,
        width: this.width,
        height: this.cell.height * pos,
      });

      // Create overlay rectangle below the highlighted row
      this.createOverlay({
        x: 0,
        y: this.cell.height * (pos + nbCells),
        width: this.width,
        height: this.cell.height * (this.rowLabels.length - pos - nbCells),
      });
    }
  }

  // Create a rectangle that overlays over the heatmap
  createOverlay({ x, y, width, height }: $TSFixMe) {
    const overlay = this.gCells
      .append("rect")
      .style("fill", "white")
      .style("opacity", 0.8)
      .attr("x", x)
      .attr("y", y)
      .attr("width", width)
      .attr("height", height);

    this.overlays.push(overlay);
  }

  // Clear previously drawn overlays
  clearOverlays() {
    this.overlays.map((d: $TSFixMe) => d.remove());
    this.overlays = [];
  }

  updateLabelHighlights(nodes: $TSFixMe, labels: $TSFixMe) {
    nodes
      .data(labels, (d: $TSFixMe) => d.label)
      .classed(cs.highlighted, (d: $TSFixMe) => d.highlighted);
  }

  renderDendrogram(
    container: $TSFixMe,
    tree: $TSFixMe,
    targets: $TSFixMe,
    width: $TSFixMe,
    height: $TSFixMe,
  ) {
    const cluster = d3.layout
      .cluster()
      .size([width, height])
      .separation(function () {
        return 1;
      });

    const diagonal = (d: $TSFixMe, useRectEdges: $TSFixMe) => {
      if (useRectEdges === true) {
        return `M${d.source.y},${d.source.x}V${d.target.x}H${d.target.y}`;
      }

      const radius = 4;
      const dir = (d.source.x - d.target.x) / Math.abs(d.source.x - d.target.x);
      return `M${d.source.y},${d.source.x}
                L${d.source.y},${d.target.x + dir * radius}
                A${radius} ${radius} 0, 0, ${(dir + 1) / 2}, ${
        d.source.y + radius
      } ${d.target.x}
                L${d.target.y},${d.target.x}`;
    };

    const updateHighlights = (node: $TSFixMe, highlighted: $TSFixMe) => {
      const stack = [node];

      targets.forEach((target: $TSFixMe) => {
        target.shaded = highlighted;
      });

      const toUpdate = [];
      while (stack.length) {
        const node = stack.pop();
        node.highlighted = highlighted;
        if (node.left) stack.push(node.left);
        if (node.right) stack.push(node.right);

        if (highlighted && node.value && node.value.idx >= 0)
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
          toUpdate.push(targets[node.value.idx]);
      }

      // Highlight dendrogram branches
      container
        .selectAll(`.${cs.link}`)
        .data(cluster.links(nodes))
        .classed(cs.highlighted, (d: $TSFixMe) => d.source.highlighted);

      // Highlight heatmap rows/columns
      if (!highlighted || toUpdate.length === 0)
        this.highlightRowOrColumn(null);
      else {
        // Start at the lowest positioned row or column, and highlight `toUpdate.length` cells
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
        const rowOrColumn = minBy(d => d.pos, toUpdate);
        this.highlightRowOrColumn(rowOrColumn, toUpdate.length);
      }
    };

    cluster.children(function (d: $TSFixMe) {
      const children = [];
      if (d.left) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        children.push(d.left);
      }
      if (d.right) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        children.push(d.right);
      }
      return children;
    });

    const nodes = cluster.nodes(tree);

    const links = container
      .selectAll(`.${cs.link}`)
      .data(cluster.links(nodes))
      .enter()
      .append("g")
      .attr("class", cs.link);

    links.append("path").attr("class", cs.linkPath).attr("d", diagonal);

    links
      .append("rect")
      .attr("class", cs.hoverTarget)
      .attr("x", (d: $TSFixMe) => Math.min(d.source.y, d.target.y))
      .attr("y", (d: $TSFixMe) => Math.min(d.source.x, d.target.x))
      .attr("width", (d: $TSFixMe) => {
        const targetY = Math.max(d.source.left.y, d.source.right.y);
        return Math.abs(targetY - d.source.y) + this.options.spacing;
      })
      .attr("height", (d: $TSFixMe) => Math.abs(d.target.x - d.source.x))
      .on("mouseover", (d: $TSFixMe) => {
        updateHighlights(d.source, true);
      })
      .on("mouseout", (d: $TSFixMe) => {
        updateHighlights(d.source, false);
      });
  }

  getAddMetadataTriggerRef() {
    return this.addMetadataTrigger;
  }

  getColumnMetadataLegend(value: $TSFixMe) {
    if (
      some(
        this.columnLabels,
        label => !label.metadata || !label.metadata[value],
      )
    ) {
      return Object.assign({}, this.metadataColors[value], {
        Unknown: this.options.colorNoValue,
      });
    } else {
      return this.metadataColors[value];
    }
  }

  getZoomFactor() {
    if (this.options.zoom !== null) return this.options.zoom;
    // Decrease the max width slightly to avoid zooming slightly too much, which
    // would produce a useless horizontal scrollbar.
    const adjustedMaxWidth = this.options.maxWidth - 8;
    // Shrink to fit
    return Math.min(this.width, adjustedMaxWidth) / this.width;
  }
}
