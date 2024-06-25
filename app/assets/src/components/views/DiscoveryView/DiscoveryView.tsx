import { Tab, Tabs } from "@czi-sds/components";
import {
  capitalize,
  clone,
  compact,
  concat,
  escapeRegExp,
  find,
  get as _get,
  isEmpty,
  isNull,
  isUndefined,
  keyBy,
  mapValues,
  merge,
  pick,
  some,
  sumBy,
  union,
  values,
  xor,
  xorBy,
} from "lodash/fp";
import { nanoid } from "nanoid";
import React, { ReactNode } from "react";
import { SortDirectionType } from "react-virtualized";
import { getSearchSuggestions } from "~/api";
import { trackPageTransition } from "~/api/analytics";
import { Divider } from "~/components/layout";
import NarrowContainer from "~/components/layout/NarrowContainer";
import {
  BENCHMARKING_FEATURE,
  SAMPLES_TABLE_METADATA_COLUMNS_ADMIN_FEATURE,
  SORTING_V0_ADMIN_FEATURE,
} from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import { isNotNullish } from "~/components/utils/typeUtils";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import {
  DISCOVERY_VIEW_SOURCE_TEMP_PERSISTED_OPTIONS,
  generateUrlToSampleView,
  getTempSelectedOptions,
  TempSelectedOptionsShape,
} from "~/components/utils/urls";
import {
  WorkflowCount,
  workflowIsWorkflowRunEntity,
  WORKFLOWS,
  WorkflowType,
  WORKFLOW_ENTITIES,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import { MAP_CLUSTER_ENABLED_LEVELS } from "~/components/views/DiscoveryView/components/DiscoveryMap/constants";
import { indexOfMapLevel } from "~/components/views/DiscoveryView/components/DiscoveryMap/utils";
import {
  DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW,
  DEFAULT_SORTED_COLUMN_BY_TAB,
} from "~/components/views/DiscoveryView/components/SamplesView/columnConfiguration";
import {
  NOTIFICATION_TYPES,
  showNotification,
} from "~/components/views/SampleView/utils";
import { loadState } from "~/helpers/storage";
import {
  Conditions,
  ConfigForWorkflow,
  Dimension,
  DimensionValue,
  DiscoveryViewProps,
  DiscoveryViewState,
  MapEntry,
  SelectedFilters,
} from "~/interface/discoveryView";
import {
  BaseWorkflowRun,
  FilterList,
  PipelineTypeRun,
  SamplesViewHandle,
} from "~/interface/samplesView";
import { Project } from "~/interface/shared";
import ImgProjectsSecondary from "~ui/illustrations/ImgProjectsSecondary";
import ImgSamplesSecondary from "~ui/illustrations/ImgSamplesSecondary";
import ImgVizSecondary from "~ui/illustrations/ImgVizSecondary";
import {
  AMR_EXISTING_SAMPLES_LINK,
  VISUALIZATIONS_DOC_LINK,
} from "~utils/documentationLinks";
import { openUrl } from "~utils/links";
import { InfoBanner } from "../../common/InfoBanner";
import { DiscoveryFilters } from "./components/DiscoveryFilters";
import { DiscoveryHeader } from "./components/DiscoveryHeader";
import { DiscoverySidebar } from "./components/DiscoverySidebar";
import { MapPreviewSidebar } from "./components/MapPreviewSidebar";
import { ModalFirstTimeUser } from "./components/ModalFirstTimeUser";
import { NoSearchResultsBanner } from "./components/NoResultsBanner";
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectsView } from "./components/ProjectsView/ProjectsView";
import { CgRow, SamplesView } from "./components/SamplesView";
import {
  Visualization,
  VisualizationsView,
} from "./components/VisualizationsView/VisualizationsView";
import {
  CURRENT_TAB_OPTIONS,
  DISPLAY_PLQC,
  KEY_DISCOVERY_SESSION_FILTERS,
  KEY_DISCOVERY_VIEW_OPTIONS,
  TAB_PROJECTS,
  TAB_SAMPLES,
  TAB_VISUALIZATIONS,
} from "./constants";
import {
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
  DISCOVERY_DOMAIN_SNAPSHOT,
  getDiscoveryDimensions,
  getDiscoveryLocations,
  getDiscoveryStats,
  getDiscoveryVisualizations,
} from "./discovery_api";
import cs from "./discovery_view.scss";
import { DiscoveryDataLayer, ObjectCollectionView } from "./DiscoveryDataLayer";
import { ProjectCountsType } from "./DiscoveryViewFC";
import {
  getOrderByKeyFor,
  getOrderDirKeyFor,
  getSessionOrderFieldsKeys,
  prepareFilters,
  prepareNextGenFilters,
} from "./utils";

const SAMPLES_UPLOAD_URL = "/samples/upload";

// Data available
// (A) non-filtered dimensions: for filter options
// (B) filtered dimensions: for sidebar
// (C) filtered stats
// (D) synchronous data: for projects and visualization tables
// (E) asynchronous data: for samples, triggered on demand by infinite table
// Data workflow
// * Initial load:
//   - load (A) non-filtered dimensions, (C) filtered stats and (D) synchronous table data
//   * if filter or project is set
//     - load (B) filtered dimensions and (C) filtered stats
// * On filter change:
//   - load (B) filtered dimensions, (C) filtered stats
//     * if project not set
//       load (D) synchronous table data
// * On project selected
//   - load (A) non-filtered dimensions, (B) filtered dimensions and (C) filtered stats
//     (synchronous data not needed for now because we do not show projects and visualizations)

export class DiscoveryView extends React.Component<
  DiscoveryViewWithFCProps,
  DiscoveryViewState
> {
  amrWorkflowRuns: ObjectCollectionView<BaseWorkflowRun, string>;
  benchmarkWorkflowRuns: ObjectCollectionView<BaseWorkflowRun, string>;
  configForWorkflow: Record<WorkflowType, ConfigForWorkflow>;
  dataLayer: DiscoveryDataLayer;
  longReadMngsSamples: ObjectCollectionView<PipelineTypeRun, string>;
  mapPreviewProjects: ObjectCollectionView<Project, string>;
  mapPreviewSamples: ObjectCollectionView<PipelineTypeRun, string>;
  mapPreviewSidebar: MapPreviewSidebar;
  projects: ObjectCollectionView<Project, string>;
  projectsView: ProjectsView;
  samples: ObjectCollectionView<PipelineTypeRun, string>;
  samplesView: React.RefObject<SamplesViewHandle>;
  urlParser: UrlQueryParser;
  visualizations: ObjectCollectionView<Visualization, number>;
  visualizationsView: VisualizationsView;
  workflowEntity: string;
  constructor(props: DiscoveryViewWithFCProps) {
    super(props);
    const { domain, projectId, updateDiscoveryProjectId } = this.props;

    this.urlParser = new UrlQueryParser({
      filters: "object",
      projectId: "string",
      showFilters: "boolean",
      showStats: "boolean",
    });

    const urlState = this.urlParser.parse(location.search);
    const sessionState = loadState(sessionStorage, KEY_DISCOVERY_VIEW_OPTIONS);
    const localState = loadState(localStorage, KEY_DISCOVERY_VIEW_OPTIONS);

    const projectIdToUpdate = projectId || urlState.projectId;

    // If the projectId was passed as props or is in the URL, update the projectIds in the redux state via the updateProjectIds action creator
    updateDiscoveryProjectId(projectIdToUpdate || null);

    const storedState = { ...localState, ...sessionState, ...urlState };

    this.state = {
      currentDisplay: "table",
      currentTab:
        projectId || domain === DISCOVERY_DOMAIN_ALL_DATA
          ? TAB_SAMPLES
          : TAB_PROJECTS,
      emptyStateModalOpen: this.isFirstTimeUser(),
      filteredProjectCount: null,
      filteredProjectDimensions: [],
      filteredSampleCountsByWorkflow: {
        [WorkflowType.SHORT_READ_MNGS]: null,
        [WorkflowType.LONG_READ_MNGS]: null,
        [WorkflowType.AMR]: null,
        [WorkflowType.CONSENSUS_GENOME]: null,
        [WorkflowType.BENCHMARK]: null,
      },
      filteredSampleDimensions: [],
      filteredSampleStats: {},
      filteredVisualizationCount: null,
      filters: {},
      loadingDimensions: true,
      loadingLocations: true,
      loadingStats: true,
      mapLevel: "country",
      mapLocationData: {},
      mapPreviewedLocationId: null,
      mapSidebarProjectCount: null,
      mapSidebarProjectDimensions: [],
      mapSidebarSampleCount: null,
      mapSidebarSampleDimensions: [],
      mapSidebarSampleStats: {},
      mapSidebarTab: "summary",
      project: null,
      projectDimensions: [],
      projectId: projectId,
      rawMapLocationData: {},
      sampleActiveColumnsByWorkflow: !storedState.sampleActiveColumnsByWorkflow
        ? DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW
        : undefined,
      sampleDimensions: [],
      search: null,
      selectableSampleIds: [],
      selectedSampleIdsByWorkflow: {
        [WorkflowType.AMR]: new Set(),
        [WorkflowType.CONSENSUS_GENOME]: new Set(),
        [WorkflowType.SHORT_READ_MNGS]: new Set(),
        [WorkflowType.LONG_READ_MNGS]: new Set(),
        [WorkflowType.BENCHMARK]: new Set(),
      },
      showFilters: true,
      showStats: true,
      userDataCounts: null,
      workflowCounts: undefined,
      workflow: WorkflowType.SHORT_READ_MNGS,
      workflowEntity: WORKFLOW_ENTITIES.SAMPLES,
      ...localState,
      ...sessionState,
      ...urlState,
    };
    // getCurrentTabOrderByKey() relies on other states already being set.
    this.state = {
      ...this.state,
      orderBy: sessionState[this.getCurrentTabOrderByKey()],
      orderDirection: sessionState[this.getCurrentTabOrderDirKey()],
    };

    this.workflowEntity = WORKFLOWS[this.state.workflow].entity;

    this.dataLayer = new DiscoveryDataLayer(domain);

    this.samples = this.dataLayer.samples.createView({
      conditions: this.getConditionsWithSessionStorage(
        TAB_SAMPLES,
        WorkflowType.SHORT_READ_MNGS,
      ),
      onViewChange: () => {
        this.refreshSampleData(WorkflowType.SHORT_READ_MNGS);
      },
      shouldConvertIdToString: true,
    });

    this.amrWorkflowRuns = this.dataLayer.amrWorkflowRuns.createView({
      conditions: this.getConditionsWithSessionStorage(
        TAB_SAMPLES,
        WorkflowType.AMR,
      ),
      onViewChange: () => {
        this.refreshWorkflowRunData(WorkflowType.AMR);
      },
      shouldConvertIdToString: true,
    });

    this.benchmarkWorkflowRuns =
      this.dataLayer.benchmarkWorkflowRuns.createView({
        conditions: this.getConditionsWithSessionStorage(
          TAB_SAMPLES,
          WorkflowType.BENCHMARK,
        ),
        onViewChange: () => {
          this.refreshWorkflowRunData(WorkflowType.BENCHMARK);
        },
        shouldConvertIdToString: true,
      });

    this.longReadMngsSamples = this.dataLayer.longReadMngsSamples.createView({
      conditions: this.getConditionsWithSessionStorage(
        TAB_SAMPLES,
        WorkflowType.LONG_READ_MNGS,
      ),
      onViewChange: () => {
        this.refreshSampleData(WorkflowType.LONG_READ_MNGS);
      },
      shouldConvertIdToString: true,
    });

    this.projects = this.dataLayer.projects.createView({
      conditions: this.getConditionsWithSessionStorage(TAB_PROJECTS),
      onViewChange: this.refreshProjectData,
      shouldConvertIdToString: true,
    });

    this.visualizations = this.dataLayer.visualizations.createView({
      conditions: this.getConditionsWithSessionStorage(TAB_VISUALIZATIONS),
      onViewChange: this.refreshVisualizationData,
      shouldConvertIdToString: false,
    });

    this.setupWorkflowConfigs();

    this.mapPreviewProjects = this.projects;
    this.mapPreviewSamples = this.samples;

    // hold references to the views to allow resetting the tables
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.projectsView = null;
    this.samplesView = React.createRef();
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.mapPreviewSidebar = null;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.visualizationsView = null;

    // preload first pages
    this.props.fetchNextGenWorkflowRuns(
      this.getConditionsWithSessionStorage(
        TAB_SAMPLES,
        WorkflowType.CONSENSUS_GENOME,
      ),
    );
    this.samples.loadPage(0);
    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      this.projects.loadPage(0);
      this.visualizations.loadPage(0);
      this.amrWorkflowRuns.loadPage(0);
      this.longReadMngsSamples.loadPage(0);
    }

    this.updateBrowsingHistory("replace");
  }

  setupWorkflowConfigs = () => {
    this.configForWorkflow = {
      [WorkflowType.AMR]: {
        bannerTitle: `${WorkflowType.AMR.toUpperCase()} Samples`,
        objectCollection: this.amrWorkflowRuns,
        noDataLinks: [
          {
            href: SAMPLES_UPLOAD_URL,
            text: `Upload new samples`,
          },
          {
            external: true,
            href: AMR_EXISTING_SAMPLES_LINK,
            text: "Learn how to rerun samples",
          },
        ],
        noDataMessage:
          `No samples were processed by the AMR Pipeline. ` +
          "You can upload new samples or rerun mNGS samples through the AMR pipeline.",
        fetchWorkflowRunsForSortChange: () => {
          // Not migrated to NextGen yet.
        },
        fetchPage: this.amrWorkflowRuns.handleLoadObjectRows,
        getSelectableIds: this.amrWorkflowRuns.getIds,
        getFilteredSampleCount: () =>
          this.state.filteredSampleCountsByWorkflow[WorkflowType.AMR],
        getRows: () => this.amrWorkflowRuns.loaded,
      },
      [WorkflowType.BENCHMARK]: {
        bannerTitle: `${WorkflowType.BENCHMARK.toUpperCase()} Samples`,
        objectCollection: this.benchmarkWorkflowRuns,
        noDataLinks: [
          {
            href: SAMPLES_UPLOAD_URL,
            text: `Benchmark existing samples`,
          },
        ],
        noDataMessage:
          `No samples were processed by the Benchmark Pipeline. ` +
          "You can Benchmark samples by selecting them in the mNGS table and clicking the 'Benchmark' icon.",
        fetchWorkflowRunsForSortChange: () => {
          // Not migrated to NextGen yet.
        },
        fetchPage: this.benchmarkWorkflowRuns.handleLoadObjectRows,
        getSelectableIds: this.benchmarkWorkflowRuns.getIds,
        getFilteredSampleCount: () =>
          this.state.filteredSampleCountsByWorkflow[WorkflowType.BENCHMARK],
        getRows: () => this.benchmarkWorkflowRuns.loaded,
      },
      [WorkflowType.CONSENSUS_GENOME]: {
        bannerTitle: WORKFLOWS[WorkflowType.CONSENSUS_GENOME].pluralizedLabel,
        noDataLinks: this.getNoDataLinks(
          WORKFLOWS[WorkflowType.CONSENSUS_GENOME].pluralizedLabel,
        ),
        noDataMessage: this.getNoDataBannerMessage(
          WORKFLOW_TABS.CONSENSUS_GENOME,
        ),
        fetchWorkflowRunsForSortChange: (conditions: Conditions) =>
          this.props.fetchNextGenWorkflowRuns(
            conditions,
            WorkflowType.CONSENSUS_GENOME,
          ),
        fetchPage: ({ startIndex }) => this.props.fetchCgPage(startIndex),
        getSelectableIds: () => this.props.cgWorkflowIds,
        getFilteredSampleCount: () => this.props.cgWorkflowIds?.length,
        // When we're reading from Rails, it's possible for rows to be undefined if a workflow was
        // executed between the 2 calls. FC still needs to return the undefined rows to
        // <InfiniteTable> to satisfy the 20 rows per request requirement, but getRows() doesn't
        // expect undefineds.
        getRows: () => this.props.cgRows.filter(isNotNullish),
      },
      [WorkflowType.SHORT_READ_MNGS]: {
        bannerTitle: `${WORKFLOW_TABS.SHORT_READ_MNGS} Samples`,
        objectCollection: this.samples,
        noDataLinks: this.getNoDataLinks(
          WORKFLOWS[WorkflowType.SHORT_READ_MNGS].pluralizedLabel,
        ),
        noDataMessage: this.getNoDataBannerMessage(
          WORKFLOW_TABS.SHORT_READ_MNGS,
        ),
        fetchWorkflowRunsForSortChange: () => {
          // Not migrated to NextGen yet.
        },
        fetchPage: this.samples.handleLoadObjectRows,
        getSelectableIds: this.samples.getIds,
        getFilteredSampleCount: () =>
          this.state.filteredSampleCountsByWorkflow[
            WorkflowType.SHORT_READ_MNGS
          ],
        getRows: () => this.samples.loaded,
      },
      [WorkflowType.LONG_READ_MNGS]: {
        bannerTitle: `${WORKFLOW_TABS.LONG_READ_MNGS} Samples`,
        objectCollection: this.longReadMngsSamples,
        noDataLinks: this.getNoDataLinks(
          WORKFLOWS[WorkflowType.LONG_READ_MNGS].pluralizedLabel,
        ),
        noDataMessage: this.getNoDataBannerMessage(
          WORKFLOW_TABS.LONG_READ_MNGS,
        ),
        fetchWorkflowRunsForSortChange: () => {
          // Not migrated to NextGen yet.
        },
        fetchPage: this.longReadMngsSamples.handleLoadObjectRows,
        getSelectableIds: this.longReadMngsSamples.getIds,
        getFilteredSampleCount: () =>
          this.state.filteredSampleCountsByWorkflow[
            WorkflowType.LONG_READ_MNGS
          ],
        getRows: () => this.longReadMngsSamples.loaded,
      },
      // @ts-expect-error This value is unused.
      [WorkflowType.AMR_DEPRECATED]: {},
    };
  };

  getWorkflowToDisplay = (
    initialWorkflow: WorkflowType,
    countByWorkflow: WorkflowCount,
  ) => {
    // If default workflow does not have any samples, switch to a tab with samples
    // Order to check tabs is SHORT_READ_MNGS, LONG_READ_MNGS, CONSENSUS_GENOME, then AMR
    const initialWorkflowCount = countByWorkflow?.[initialWorkflow] || 0;
    if (initialWorkflowCount > 0) {
      return initialWorkflow;
    }

    const numOfShortReadMngsSamples =
      countByWorkflow?.[WorkflowType.SHORT_READ_MNGS];
    const numOfLongReadMngsSamples =
      countByWorkflow?.[WorkflowType.LONG_READ_MNGS];
    const numOfCgSamples = countByWorkflow?.[WorkflowType.CONSENSUS_GENOME];
    const numOfAmrSamples = countByWorkflow?.[WorkflowType.AMR];

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (numOfShortReadMngsSamples > 0) {
      return WorkflowType.SHORT_READ_MNGS;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    } else if (numOfLongReadMngsSamples > 0) {
      return WorkflowType.LONG_READ_MNGS;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    } else if (numOfCgSamples > 0) {
      return WorkflowType.CONSENSUS_GENOME;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    } else if (numOfAmrSamples > 0) {
      return WorkflowType.AMR;
    }

    // If the user has no samples at all, return short-read-mngs
    return WorkflowType.SHORT_READ_MNGS;
  };

  async componentDidMount() {
    // If a user had previously selected the PLQC view for a specific project,
    // ensure that currentDisplay defaults to "table" if they switch to a different view,
    // since the PLQC display only exists when viewing a single project.
    if (this.state.currentDisplay === "plqc" && !this.state.projectId) {
      this.setState({ currentDisplay: "table" });
    }

    this.initialLoad();

    // this event is triggered when a user clicks "Back" in their browser
    // to make sure session sorting parameters are preserved, we need
    // to set the correct order parameters in the state
    window.onpopstate = () => {
      this.setState(
        {
          ...history.state,
          ...this.getOrderStateFieldsFor(
            history.state.currentTab,
            history.state.workflow,
          ),
        },
        () => {
          this.resetData({
            callback: this.initialLoad,
          });
        },
      );
    };
  }

  /** This grabs orderBy and orderDir from sessionStorage. */
  getConditionsWithSessionStorage = (
    tab: string,
    workflow?: WorkflowType,
  ): Conditions => {
    return {
      ...this.getConditions(workflow),
      ...this.getDataLayerOrderStateFieldsFor(tab, workflow),
    };
  };

  // TODO: Delete this unnecessary method.
  getConditions = (workflow?: WorkflowType): Conditions => {
    const { filters, projectId, search, orderBy, orderDirection } = this.state;
    const { snapshotShareId } = this.props;

    return {
      projectId,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      snapshotShareId,
      search,
      orderBy,
      orderDir: orderDirection,
      filters: {
        ...prepareFilters(filters),
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        workflow,
      },
      nextGenFilters: prepareNextGenFilters(filters),
    };
  };

  overwriteCGDefaultActiveColumns({
    stateObject,
  }: {
    stateObject: Partial<DiscoveryViewState>;
  }) {
    const defaultCGColumns =
      DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW[WorkflowType.CONSENSUS_GENOME];

    // eslint-disable-next-line standard/computed-property-even-spacing
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    stateObject.sampleActiveColumnsByWorkflow[WorkflowType.CONSENSUS_GENOME] =
      defaultCGColumns;
    stateObject["updatedAt"] = new Date();

    return stateObject;
  }

  getCurrentTabOrderByKey() {
    const { currentTab, workflow } = this.state;
    return getOrderByKeyFor(currentTab, workflow);
  }

  getCurrentTabOrderDirKey() {
    const { currentTab, workflow } = this.state;
    return getOrderDirKeyFor(currentTab, workflow);
  }

  getOrderStateFieldsFor = (
    tab: string,
    workflow?: WorkflowType,
  ): {
    orderBy: string | undefined;
    orderDirection: SortDirectionType | undefined;
  } => {
    const sessionState = loadState(sessionStorage, KEY_DISCOVERY_VIEW_OPTIONS);
    const orderBy = sessionState[`${getOrderByKeyFor(tab, workflow)}`];
    const orderDirection = sessionState[`${getOrderDirKeyFor(tab, workflow)}`];
    return { orderBy, orderDirection };
  };

  getDataLayerOrderStateFieldsFor = (tab: string, workflow?: WorkflowType) => {
    const { orderBy, orderDirection: orderDir } = this.getOrderStateFieldsFor(
      tab,
      workflow,
    );
    return { orderBy, orderDir };
  };

  updateBrowsingHistory = (action = "push") => {
    const { domain, snapshotShareId, updateDiscoveryProjectId } = this.props;
    const { currentTab, orderBy, orderDirection } = this.state;

    const { updatedAt: updatedAtFromLocalStorage } = loadState(
      localStorage,
      KEY_DISCOVERY_VIEW_OPTIONS,
    );

    const currentSessionStorageState = loadState(
      sessionStorage,
      KEY_DISCOVERY_VIEW_OPTIONS,
    );

    const { updatedAt: updatedAtFromSessionStorage } =
      currentSessionStorageState;

    // prevent existing order fields from being removed from session storage
    const orderFieldsInSessionStorage = pick(
      getSessionOrderFieldsKeys(),
      currentSessionStorageState,
    );

    const localFields = [
      "sampleActiveColumnsByWorkflow",
      "showFilters",
      "showStats",
      "updatedAt",
    ];

    const sessionFields = concat(localFields, [
      "currentDisplay",
      KEY_DISCOVERY_SESSION_FILTERS,
      "mapSidebarTab",
      "workflow",
    ]);

    const urlFields = concat(sessionFields, [
      "currentTab",
      "projectId",
      "search",
      "appcue",
      // Omit sampleActiveColumnsByWorkflow from URL b/c it's too large
    ]).filter(key => key !== "sampleActiveColumnsByWorkflow");
    const stateFields = concat(urlFields, ["project"]);

    let localState = pick(localFields, this.state);
    localState["updatedAt"] = updatedAtFromLocalStorage;

    let sessionState = {
      ...pick(sessionFields, this.state),
      ...orderFieldsInSessionStorage,
    };
    sessionState["updatedAt"] = updatedAtFromSessionStorage;

    if (CURRENT_TAB_OPTIONS.includes(currentTab)) {
      sessionState[`${this.getCurrentTabOrderByKey()}`] = orderBy;
      sessionState[`${this.getCurrentTabOrderDirKey()}`] = orderDirection;
    }

    // TODO(omar): This is a temporary fix to ensure that upon launch of [v1] General Viral CG,
    // users will have the reference accession column appear by default next to the sample name.
    // This should be removed after some period of time where we know that all users have the
    // correct default "consensus-genome" columns.
    if (!updatedAtFromLocalStorage) {
      localState = this.overwriteCGDefaultActiveColumns({
        stateObject: localState,
      });
    } else if (!updatedAtFromSessionStorage) {
      sessionState = this.overwriteCGDefaultActiveColumns({
        stateObject: sessionState,
      });
    }

    const urlState = pick(urlFields, this.state);
    const historyState = pick(stateFields, this.state);

    // If the url doesn't have the projectId in it, reset projectId to null in global redux state via redux action creator
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    !urlState.projectId && updateDiscoveryProjectId(urlState.projectId);

    // Saving on URL enables sharing current view with other users
    let urlQuery = this.urlParser.stringify(urlState);
    if (urlQuery) {
      urlQuery = `?${urlQuery}`;
    }
    const prefix = snapshotShareId ? this.getSnapshotPrefix() : `/${domain}`;

    // History state may include some small fields that enable direct loading of previous pages
    // from browser history without having to request those fields from server (e.g. project)
    if (action === "push") {
      history.pushState(
        historyState,
        `DiscoveryView:${domain}`,
        `${prefix}${urlQuery}`,
      );
    } else {
      history.replaceState(
        historyState,
        `DiscoveryView:${domain}`,
        `${prefix}${urlQuery}`,
      );
    }

    // We want to persist all options when user navigates to other pages within the same session
    sessionStorage.setItem(
      KEY_DISCOVERY_VIEW_OPTIONS,
      JSON.stringify(sessionState),
    );

    // We want to persist some options when user returns to the page on a different session
    localStorage.setItem(
      KEY_DISCOVERY_VIEW_OPTIONS,
      JSON.stringify(localState),
    );

    // Track changes to the page that did not cause a page load but the URL was updated
    // Used specifically to notify Appcues
    trackPageTransition();
  };

  isFirstTimeUser = () => {
    // we can tell if a user is new to the platform if they have just completed the profile form
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get("profile_form_submitted");
  };

  resetData = ({ callback }: { callback?(): void } = {}) => {
    const { allowedFeatures, domain, fetchNextGenWorkflowRuns } = this.props;
    const conditions = this.getConditions();

    this.samples.reset({
      conditions: this.getConditionsWithSessionStorage(
        TAB_SAMPLES,
        WorkflowType.SHORT_READ_MNGS,
      ),
      loadFirstPage: true,
    });

    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      fetchNextGenWorkflowRuns(
        this.getConditionsWithSessionStorage(
          TAB_SAMPLES,
          WorkflowType.CONSENSUS_GENOME,
        ),
      );

      this.projects.reset({
        conditions: this.getConditionsWithSessionStorage(TAB_PROJECTS),
        loadFirstPage: true,
      });
      this.visualizations.reset({
        conditions: this.getConditionsWithSessionStorage(TAB_VISUALIZATIONS),
        loadFirstPage: true,
      });
      this.amrWorkflowRuns.reset({
        conditions: this.getConditionsWithSessionStorage(
          TAB_SAMPLES,
          WorkflowType.AMR,
        ),
        loadFirstPage: true,
      });
      this.longReadMngsSamples.reset({
        conditions: this.getConditionsWithSessionStorage(
          TAB_SAMPLES,
          WorkflowType.LONG_READ_MNGS,
        ),
        loadFirstPage: true,
      });

      if (allowedFeatures.includes(BENCHMARKING_FEATURE)) {
        this.benchmarkWorkflowRuns.reset({
          conditions: this.getConditionsWithSessionStorage(
            TAB_SAMPLES,
            WorkflowType.BENCHMARK,
          ),
          loadFirstPage: true,
        });
      }
    }
    if (this.mapPreviewSamples !== this.samples) {
      this.mapPreviewSamples.reset({ conditions, loadFirstPage: true });
    }
    if (this.mapPreviewProjects !== this.projects) {
      this.mapPreviewProjects.reset({ conditions, loadFirstPage: true });
    }

    this.setState(
      {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        filteredProjectCount: null,
        filteredProjectDimensions: [],
        filteredSampleCountsByWorkflow: {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2418
          [WorkflowType.AMR]: null,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2418
          [WorkflowType.CONSENSUS_GENOME]: null,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2418
          [WorkflowType.SHORT_READ_MNGS]: null,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2418
          [WorkflowType.LONG_READ_MNGS]: null,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2418
          [WorkflowType.BENCHMARK]: null,
        },
        filteredSampleDimensions: [],
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        filteredVisualizationCount: null,
        filteredSampleStats: {},
        loadingDimensions: true,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarProjectCount: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarSampleCount: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarSampleStats: null,
        selectedSampleIdsByWorkflow: {
          [WorkflowType.AMR]: new Set(),
          [WorkflowType.CONSENSUS_GENOME]: new Set(),
          [WorkflowType.SHORT_READ_MNGS]: new Set(),
          [WorkflowType.LONG_READ_MNGS]: new Set(),
          [WorkflowType.BENCHMARK]: new Set(),
        },
      },
      () => {
        this.resetSamplesView();
        this.projectsView && this.projectsView.reset();
        this.visualizationsView && this.visualizationsView.reset();
        callback && callback();
      },
    );
  };

  initialLoad = () => {
    const { project, sampleWasDeleted } = this.state;
    const { domain } = this.props;

    if (sampleWasDeleted) {
      showNotification(NOTIFICATION_TYPES.sampleDeleteSuccess, {
        sampleName: sampleWasDeleted,
      });
      this.setState({ sampleWasDeleted: null });
    }

    domain !== DISCOVERY_DOMAIN_SNAPSHOT && this.loadUserDataStats();
    // * Initial load:
    //   - load (A) non-filtered dimensions, (C) filtered stats, (D) filtered locations, and (E) synchronous table data
    this.refreshDimensions();
    this.refreshFilteredStats();
    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      this.refreshFilteredLocations();
    }
    //   * if filter or project is set
    //     - load (B) filtered dimensions
    (this.getFilterCount() || project) && this.refreshFilteredDimensions();
  };

  resetDataFromFilterChange = ({ refreshFilterStatsCallback = null } = {}) => {
    const { domain } = this.props;
    this.resetData({
      callback: () => {
        // * On filter change:
        //   - load (B) filtered dimensions, (C) filtered stats, (D) filtered locations
        this.refreshFilteredDimensions();
        this.refreshFilteredStats(refreshFilterStatsCallback);
        if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
          this.refreshFilteredLocations();
          this.refreshSelectedPLQCSamples();
        }
      },
    });
  };

  resetDataFromSortChange = () => {
    const { currentTab } = this.state;
    if (currentTab === TAB_SAMPLES) {
      this.resetSamplesDataForSortChange();
    } else if (currentTab === TAB_PROJECTS) {
      this.resetProjectsData();
    } else if (currentTab === TAB_VISUALIZATIONS) {
      this.resetVisualizationsData();
    }
  };

  resetSamplesView = () => {
    this.samplesView?.current?.reset();
  };

  resetSamplesDataForSortChange = () => {
    const { currentTab, workflow } = this.state;
    const conditions = this.getConditions(workflow);

    if (currentTab === TAB_SAMPLES) {
      // TODO: After the Workflows Service call is only responsible for sorting Workflows-related
      // columns, only refetch the full list of IDs if sorting on a Workflows Service column.
      this.configForWorkflow[workflow].fetchWorkflowRunsForSortChange(
        conditions,
      );
    }
    this.configForWorkflow[workflow].objectCollection?.reset({
      conditions,
      loadFirstPage: true,
    });

    this.resetSamplesView();
  };

  resetProjectsData = () => {
    const conditions = this.getConditions();

    this.projects.reset({ conditions, loadFirstPage: true });
    this.projectsView && this.projectsView.reset();
  };

  resetVisualizationsData = () => {
    const conditions = this.getConditions();

    this.visualizations.reset({
      conditions,
      loadFirstPage: true,
    });
    this.visualizationsView && this.visualizationsView.reset();
  };

  refreshDataFromProjectChange = () => {
    this.resetData({
      callback: () => {
        // * On project selected
        //   - load (A) non-filtered dimensions, (B) filtered dimensions and (C) filtered stats
        //     (synchronous data not needed for now because we do not show projects and visualizations)
        this.loadUserDataStats();
        this.refreshDimensions();
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
        this.refreshFilteredLocations();
      },
    });
  };

  refreshDimensions = async () => {
    const { domain, snapshotShareId } = this.props;
    const { projectId } = this.state;

    this.setState({
      loadingDimensions: true,
    });

    const { projectDimensions, sampleDimensions } =
      await getDiscoveryDimensions({
        domain,
        projectId,
        snapshotShareId,
      });

    this.setState({
      projectDimensions,
      sampleDimensions,
      loadingDimensions: false,
    });
  };

  refreshFilteredStats = async (refreshStatsCallback = null) => {
    const { domain, snapshotShareId } = this.props;
    const { filters, projectId, search } = this.state;

    this.setState({
      loadingStats: true,
    });

    const { sampleStats: filteredSampleStats } = await getDiscoveryStats({
      domain,
      projectId,
      snapshotShareId,
      filters: prepareFilters(filters),
      search,
    });

    this.setState(
      {
        filteredSampleStats,
        loadingStats: false,
      },
      () => {
        refreshStatsCallback &&
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2349
          refreshStatsCallback(filteredSampleStats?.count);
      },
    );
  };

  refreshProjectData = () => {
    const { projectId } = this.state;

    this.setState({
      filteredProjectCount: this.projects.length,
      project: this.projects.get(projectId) ?? {
        id: projectId,
        name: "",
        editable: false,
      },
    });
  };

  refreshSampleData = (workflowTypeToUpdate: WorkflowType) => {
    const configToUpdate = this.configForWorkflow[workflowTypeToUpdate];
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    this.setState(prevState => {
      const {
        filteredSampleCountsByWorkflow: prevFilteredSampleCountsByWorkflow,
        workflow,
      } = prevState;

      const currentWorkflowIsTypeToUpdate = workflow === workflowTypeToUpdate;
      return {
        filteredSampleCountsByWorkflow: {
          ...prevFilteredSampleCountsByWorkflow,
          [workflowTypeToUpdate]:
            configToUpdate.getSelectableIds()?.length ?? 0,
        },
        ...(currentWorkflowIsTypeToUpdate && {
          selectableSampleIds: configToUpdate.getSelectableIds(),
        }),
      };
    });
  };

  refreshVisualizationData = () => {
    this.setState({
      filteredVisualizationCount: this.visualizations.length,
    });
  };

  refreshWorkflowRunData = (workflowTypeToUpdate: WorkflowType) => {
    const configToUpdate = this.configForWorkflow[workflowTypeToUpdate];

    this.setState(prevState => {
      const {
        filteredSampleCountsByWorkflow: prevFilteredSampleCountsByWorkflow,
      } = prevState;

      return {
        filteredSampleCountsByWorkflow: {
          ...prevFilteredSampleCountsByWorkflow,
          [workflowTypeToUpdate]:
            configToUpdate.getSelectableIds()?.length ?? 0,
        },
      };
    });
  };

  refreshMapSidebarProjectData = () => {
    this.setState({
      mapSidebarProjectCount: this.mapPreviewProjects.length,
    });
  };

  refreshMapSidebarSampleData = () => {
    this.setState({
      mapSidebarSampleCount: this.mapPreviewSamples.length,
    });
  };

  refreshFilteredDimensions = async () => {
    const { domain, snapshotShareId } = this.props;
    const { filters, projectId, search } = this.state;

    this.setState({
      loadingDimensions: true,
    });

    const {
      projectDimensions: filteredProjectDimensions,
      sampleDimensions: filteredSampleDimensions,
    } = await getDiscoveryDimensions({
      domain,
      projectId,
      snapshotShareId,
      filters: prepareFilters(filters),
      search,
    });

    this.setState({
      filteredProjectDimensions,
      filteredSampleDimensions,
      loadingDimensions: false,
    });
  };

  refreshFilteredLocations = async () => {
    const { domain } = this.props;
    const { filters, mapLevel, projectId, search } = this.state;

    this.setState({
      loadingLocations: true,
    });

    const mapLocationData = await getDiscoveryLocations({
      domain,
      projectId,
      filters: prepareFilters(filters),
      search,
    });

    this.setState(
      {
        mapLocationData,
        rawMapLocationData: mapLocationData,
        loadingLocations: false,
      },
      () => {
        this.refreshMapPreviewedData();
        this.handleMapLevelChange(mapLevel);
      },
    );
  };

  refreshSelectedPLQCSamples = () => {
    this.setState(
      {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        plqcPreviewedSamples: null,
      },
      this.refreshPLQCPreviewedSamples,
    );
  };

  loadUserDataStats = async () => {
    const { domain, fetchTotalWorkflowCounts } = this.props;
    const { currentTab, projectId } = this.state;
    let { workflow } = this.state;

    this.setState({
      userDataCounts: null,
      workflowCounts: undefined,
    });

    getDiscoveryStats({ domain, projectId }).then(({ sampleStats }) => {
      const countByWorkflow = sampleStats?.countByWorkflow;
      workflow = this.getWorkflowToDisplay(workflow, countByWorkflow);
      const isWorkflowRunTab = workflowIsWorkflowRunEntity(workflow);

      this.setState(
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
        {
          workflow,
          workflowEntity: WORKFLOWS[workflow].entity,
          userDataCounts: {
            sampleCount: sampleStats.count,
            projectCount: sampleStats.projectCount,
          },
          ...(!isWorkflowRunTab && {
            selectableSampleIds:
              this.configForWorkflow[workflow].getSelectableIds(),
          }),
          ...this.getOrderStateFieldsFor(currentTab, workflow),
        },
        () => {
          this.updateBrowsingHistory("replace");
        },
      );
    });
    getDiscoveryVisualizations({ domain }).then(({ visualizations }) => {
      this.setState({
        visualizationCount: visualizations.length ?? 0,
      });
    });
    fetchTotalWorkflowCounts(projectId).then(
      (workflowCounts: WorkflowCount) => {
        this.setState({
          workflowCounts,
        });
      },
    );
  };

  computeTabs = () => {
    const { domain } = this.props;
    const {
      projectId,
      filteredProjectCount,
      filteredSampleStats,
      filteredVisualizationCount,
    } = this.state;

    const renderTab = (label: string, count: ReactNode) => {
      return (
        <Tab
          key={nanoid()}
          data-testid={label?.toLowerCase()}
          label={label}
          count={count}
        />
      );
    };

    return compact([
      !projectId && {
        label: renderTab("Projects", filteredProjectCount || "-"),
        value: TAB_PROJECTS,
      },
      {
        label: renderTab("Samples", filteredSampleStats.count ?? "-"),
        value: TAB_SAMPLES,
      },
      domain !== DISCOVERY_DOMAIN_PUBLIC &&
        !projectId && {
          label: renderTab("Visualizations", filteredVisualizationCount || "-"),
          value: TAB_VISUALIZATIONS,
        },
    ]);
  };

  handleTabChange = (currentTabIndex: string) => {
    const { mapSidebarTab, workflow } = this.state;
    const currentTab = this.computeTabs()[currentTabIndex].value;
    this.setState(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      {
        currentTab,
        ...this.getOrderStateFieldsFor(currentTab, workflow),
      },
      () => {
        this.updateBrowsingHistory("replace");
      },
    );

    // Set to match 'samples' or 'projects'
    if (mapSidebarTab !== "summary") {
      this.setState({ mapSidebarTab: currentTab });
    }
  };

  handleFilterChange = ({
    selectedFilters,
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    onFilterChangeCallback = null,
  }: {
    selectedFilters: SelectedFilters | Record<string, never>;
    onFilterChangeCallback?: (filteredSampleCount: number) => void;
  }) => {
    this.setState({ filters: selectedFilters }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        refreshFilterStatsCallback: onFilterChangeCallback,
      });
    });
  };

  handleSampleActiveColumnsChange = (activeColumns: string[]) => {
    const { workflow, sampleActiveColumnsByWorkflow } = this.state;

    sampleActiveColumnsByWorkflow[workflow] = activeColumns;
    this.setState({ sampleActiveColumnsByWorkflow }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  // From the right pane sidebar, we'll add the filter value they click on if not already selected.
  // Don't call this for single selection filters.
  handleMetadataFilterClick = (
    field: keyof FilterList,
    value: DimensionValue[],
  ) => {
    const { filters: selectedFilters } = this.state;

    const key = `${field}Selected`;
    if (selectedFilters[key]) {
      if (selectedFilters[key].includes(value)) return;
      selectedFilters[key].push(value);
    } else {
      selectedFilters[key] = [value];
    }

    this.handleFilterChange({ selectedFilters });
  };

  handleSearchSelected = (
    {
      key,
      value,
      sdsTaxonFilterData,
    }: {
      key: string;
      value: string;
      sdsTaxonFilterData: {
        id: number;
        level: string;
        name: string;
      };
    },
    currentEvent: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    const { filters, search } = this.state;

    const dimensions = this.getCurrentDimensions();

    const newFilters = clone(filters);
    const selectedKey = `${key}Selected`;
    let filtersChanged = false;
    switch (key) {
      case "taxon": {
        // If the user selected a taxon we add it to the dropdown
        // (since we do know which options are available, we always added)
        let filteredTaxa = [];

        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        filteredTaxa = xorBy(
          "id",
          [sdsTaxonFilterData],
          newFilters[selectedKey],
        );

        newFilters[selectedKey] = filteredTaxa;
        filtersChanged = true;
        break;
      }
      case "sample": {
        this.handleObjectSelected({
          object: { id: value.toString() },
          currentEvent,
        });
        break;
      }
      case "project": {
        this.handleProjectSelected({
          project: this.projects.get(value.toString()) ?? {
            id: value.toString(),
            editable: false,
            name: "",
          },
        });
        break;
      }
      default: {
        // For other 'dimension' types of search we check if it is a valid option
        // If so, we add a new filter, otherwise we ignore it
        const dimension = find({ dimension: key }, dimensions);
        // TODO(tiago): currently we check if it is a valid option. We should (preferably) change server endpoint
        // to filter by project/sample set or at least provide feedback to the user in else branch
        if (dimension && find({ value }, dimension.values)) {
          newFilters[selectedKey] = xor([value], newFilters[selectedKey]);
          filtersChanged = true;
        }
      }
    }
    // We will also clear the search box if we used it to select a suggestion
    if (filtersChanged || search != null) {
      this.setState(
        {
          filters: newFilters,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          search: null,
        },
        () => {
          this.updateBrowsingHistory("replace");
          this.resetDataFromFilterChange();
        },
      );
    }
  };

  handleStringSearch = (search: string) => {
    const { search: currentSearch } = this.state;

    const parsedSearch = (search && search.trim()) || null;
    if (currentSearch !== parsedSearch) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      this.setState({ search: parsedSearch }, () => {
        this.updateBrowsingHistory("replace");
        this.resetDataFromFilterChange();
      });
    }
  };

  handleFilterToggle = () => {
    this.setState({ showFilters: !this.state.showFilters }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  handleStatsToggle = () => {
    this.setState({ showStats: !this.state.showStats }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  handleProjectSelected = ({ project }: { project: Project }) => {
    const { mapSidebarTab, workflow } = this.state;
    const { updateDiscoveryProjectId } = this.props;

    this.setState(
      {
        currentDisplay: "table",
        currentTab: TAB_SAMPLES,
        mapSidebarTab:
          mapSidebarTab === "summary" ? mapSidebarTab : TAB_SAMPLES,
        projectId: project.id,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        search: null,
        ...this.getOrderStateFieldsFor(TAB_SAMPLES, workflow),
      },
      () => {
        updateDiscoveryProjectId(project.id);
        this.projects.reset({ conditions: this.getConditions() });
        this.projects.loadPage(0);
        this.clearMapPreview();
        this.updateBrowsingHistory();
        this.refreshDataFromProjectChange();
      },
    );
  };

  handleObjectSelected = ({
    object,
    currentEvent,
  }: {
    object: { id: string };
    currentEvent: React.MouseEvent<HTMLDivElement, MouseEvent>;
  }) => {
    const { snapshotShareId, history: RouterHistory } = this.props;
    const { filters, workflow, workflowEntity } = this.state;
    const { annotationsSelected, taxonSelected, taxonThresholdsSelected } =
      filters;

    let sampleId: string;
    let workflowRunId: string | undefined;
    let tempSelectedOptions: TempSelectedOptionsShape;

    if (workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS) {
      sampleId = _get("sample.id", object);
      workflowRunId = object.id;
    } else {
      sampleId = _get("id", object);
    }

    const persistedFiltersSelected = [
      annotationsSelected,
      taxonSelected,
      taxonThresholdsSelected,
    ].some(filter => !isEmpty(filter));

    if (persistedFiltersSelected) {
      tempSelectedOptions = getTempSelectedOptions({
        optionsToTemporarilyPersist: [
          "annotationsSelected",
          "taxonSelected",
          "taxonThresholdsSelected",
        ],
        selectedOptions: filters,
        source: DISCOVERY_VIEW_SOURCE_TEMP_PERSISTED_OPTIONS,
      });
    }

    const url = generateUrlToSampleView({
      workflow,
      sampleId: sampleId.toString(),
      workflowRunId,
      snapshotShareId,
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2454
      tempSelectedOptions,
    });

    // If user used CMD or CTRL, openUrl will open in a new tab:
    if (currentEvent && (currentEvent.metaKey || currentEvent.ctrlKey)) {
      openUrl(url, currentEvent);
    } else {
      // Otherwise navigate via React Router:
      RouterHistory.push(url);
    }
  };

  getSnapshotPrefix = () => {
    const { snapshotShareId } = this.props;
    return snapshotShareId ? `/pub/${snapshotShareId}` : "";
  };

  handleProjectUpdated = ({ project }: { project: Project }) => {
    this.dataLayer.projects.update(project);
    this.setState({
      project,
    });
  };

  getCurrentDimensions = () => {
    const { currentTab, projectDimensions, sampleDimensions } = this.state;

    return {
      projects: projectDimensions,
      samples: sampleDimensions,
    }[currentTab];
  };

  getClientSideSuggestions = async (query: string) => {
    const dimensions = this.getCurrentDimensions();

    const suggestions = {};
    const re = new RegExp(escapeRegExp(query), "i");
    ["host", "tissue", "locationV2"].forEach(category => {
      const dimension = find({ dimension: category }, dimensions);
      if (dimension) {
        const results = dimension.values
          .filter(entry => re.test(entry.text))
          .map(entry => ({
            category,
            id: entry.value,
            title: entry.text,
          }));

        if (results.length) {
          suggestions[category] = {
            name: this.getName(category),
            results,
          };
        }
      }
    });

    return suggestions;
  };

  getName = (category: string) => {
    if (category === "locationV2") {
      return "location";
    } else if (category === "tissue") {
      // It's too hard to rename all JS so we just rename here
      return "Sample Type";
    } else {
      return capitalize(category);
    }
  };

  handleProjectDescriptionSave = (value: string) => {
    this.setState({
      project: { ...this.state.project, description: value },
    });
  };

  getServerSideSuggestions = async (query: string, projectId: string) => {
    const { domain } = this.props;
    return getSearchSuggestions(
      // NOTE: backend also supports "tissue", "location", "host" and more
      {
        categories: ["sample", "project", "taxon"],
        query: query,
        domain: domain,
        projectId: projectId,
      },
    );
  };

  handleSearchTriggered = async (query: string, projectId: string) => {
    const [clientSideSuggestions, serverSideSuggestions] = await Promise.all([
      // client side: for dimensions (host, location, tissue)
      this.getClientSideSuggestions(query),
      // server side: for taxa, projects and samples search (filter by domain)
      this.getServerSideSuggestions(query, projectId),
    ]);

    return merge(clientSideSuggestions, serverSideSuggestions);
  };

  getFilterCount = () => {
    const { filters } = this.state;
    return sumBy(
      filters => (Array.isArray(filters) ? filters.length : !filters ? 0 : 1),
      values(filters),
    );
  };

  handleDisplaySwitch = (currentDisplay: string) => {
    this.setState({ currentDisplay }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  handleMapTooltipTitleClick = (locationId: number) => {
    const { currentTab } = this.state;
    this.setState(
      {
        mapPreviewedLocationId: locationId,
        mapSidebarTab: currentTab,
        showStats: true,
      },
      () => {
        this.refreshMapPreviewedData();
      },
    );
  };

  handleMapMarkerClick = (locationId: number) => {
    this.setState(
      {
        mapPreviewedLocationId: locationId,
        showStats: true,
      },
      () => {
        this.refreshMapPreviewedData();
      },
    );
  };

  clearMapPreview = () => {
    const { mapPreviewedLocationId } = this.state;
    if (mapPreviewedLocationId) {
      this.mapPreviewProjects = this.projects;
      this.mapPreviewSamples = this.samples;
      this.setState({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapPreviewedLocationId: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarSampleCount: null,
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: {},
      });
    }
  };

  refreshMapPreviewedSamples = async () => {
    const { mapLocationData, mapPreviewedLocationId } = this.state;

    if (!mapPreviewedLocationId || !mapLocationData[mapPreviewedLocationId]) {
      // Previewed location has been filtered out, so exit preview mode.
      this.mapPreviewSamples = this.samples;
      this.setState({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapPreviewedLocationId: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarSampleCount: null,
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: {},
      });
    } else {
      const conditions = this.getConditions();
      conditions.filters.locationV2 = [
        mapLocationData[mapPreviewedLocationId].name,
      ];
      this.mapPreviewSamples = this.dataLayer.samples.createView({
        conditions,
        onViewChange: this.refreshMapSidebarSampleData,
        shouldConvertIdToString: true,
      });
      this.mapPreviewSamples.loadPage(0);
    }
  };

  handlePLQCHistogramBarClick = (sampleIds: string[]) => {
    this.setState(
      {
        plqcPreviewedSamples: sampleIds,
        showStats: true,
      },
      () => {
        this.refreshPLQCPreviewedSamples();
      },
    );
  };

  refreshPLQCPreviewedSamples = async () => {
    const { plqcPreviewedSamples } = this.state;
    const { domain } = this.props;
    const conditions = this.getConditions();

    if (plqcPreviewedSamples && plqcPreviewedSamples.length > 0) {
      conditions.sampleIds = plqcPreviewedSamples;
      this.mapPreviewSamples = this.dataLayer.samples.createView({
        conditions,
        onViewChange: this.refreshMapSidebarSampleData,
        shouldConvertIdToString: true,
      });
      this.mapPreviewSamples.loadPage(0);
    } else {
      // if no sample ids, then display all samples
      this.mapPreviewSamples = this.samples;
    }

    const mapSidebarSampleCount =
      plqcPreviewedSamples && plqcPreviewedSamples.length > 0
        ? plqcPreviewedSamples.length
        : this.mapPreviewSamples.length;
    const [{ sampleStats }, { sampleDimensions }] = await Promise.all([
      getDiscoveryStats({ domain, ...conditions }),
      getDiscoveryDimensions({ domain, ...conditions }),
    ]);
    this.setState({
      mapSidebarTab: TAB_SAMPLES,
      mapSidebarSampleStats: sampleStats,
      mapSidebarSampleCount: mapSidebarSampleCount,
      mapSidebarSampleDimensions: sampleDimensions,
    });
    this.mapPreviewSidebar && this.mapPreviewSidebar.reset();
  };

  refreshMapPreviewedProjects = async () => {
    const { mapLocationData, mapPreviewedLocationId } = this.state;

    if (!mapPreviewedLocationId || !mapLocationData[mapPreviewedLocationId]) {
      // Previewed location has been filtered out, so exit preview mode.
      this.mapPreviewProjects = this.projects;
      this.setState({
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapPreviewedLocationId: null,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
      });
    } else {
      const conditions = this.getConditions();
      conditions.filters.locationV2 = [
        mapLocationData[mapPreviewedLocationId].name,
      ];
      this.mapPreviewProjects = this.dataLayer.projects.createView({
        conditions,
        onViewChange: this.refreshMapSidebarProjectData,
        shouldConvertIdToString: false,
      });
      this.mapPreviewProjects.loadPage(0);
    }
  };

  refreshMapPreviewedDimensions = async () => {
    const { mapLocationData, mapPreviewedLocationId } = this.state;
    const { domain } = this.props;

    if (!mapPreviewedLocationId || !mapLocationData[mapPreviewedLocationId]) {
      return;
    }

    // Fetch stats and dimensions for the map sidebar. Special request with the current filters
    // and the previewed location.
    const params = this.getConditions();
    params.filters["locationV2"] = [
      mapLocationData[mapPreviewedLocationId].name,
    ];
    const [{ sampleStats }, { projectDimensions, sampleDimensions }] =
      await Promise.all([
        getDiscoveryStats({ domain, ...params }),
        getDiscoveryDimensions({ domain, ...params }),
      ]);
    this.setState({
      mapSidebarProjectDimensions: projectDimensions,
      mapSidebarSampleDimensions: sampleDimensions,
      mapSidebarSampleStats: sampleStats,
    });
  };

  refreshMapPreviewedData = async () => {
    this.refreshMapPreviewedSamples();
    this.refreshMapPreviewedProjects();
    this.refreshMapPreviewedDimensions();
    this.mapPreviewSidebar && this.mapPreviewSidebar.reset();
  };

  handleSelectedSamplesUpdate = (selectedSampleIds: Set<string>) => {
    const { workflow, selectedSampleIdsByWorkflow } = this.state;
    this.setState({
      selectedSampleIdsByWorkflow: {
        ...selectedSampleIdsByWorkflow,
        [workflow]: selectedSampleIds,
      },
    });
  };

  handleSortColumn = ({
    sortBy,
    sortDirection,
  }: {
    sortBy: string;
    sortDirection: SortDirectionType;
  }) => {
    this.setState({ orderBy: sortBy, orderDirection: sortDirection }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromSortChange();
    });
  };

  handleMapSidebarTabChange = (mapSidebarTab: string) =>
    this.setState({ mapSidebarTab });

  handleClearFilters = () => {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.setState({ filters: {}, search: null }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
    });
  };

  handleMapLevelChange = (mapLevel: string) => {
    const { rawMapLocationData, currentTab } = this.state;

    const ids = currentTab === TAB_SAMPLES ? "sample_ids" : "project_ids";
    const clusteredData: DiscoveryViewState["rawMapLocationData"] = {};

    const copyLocation = (entry: MapEntry) => {
      return {
        ...entry,
        [ids]: Object.assign([], entry[ids]),
        hasOwnEntries: !isEmpty(entry[ids]),
      };
    };

    const addToAncestor = (entry: MapEntry, ancestorLevel: string) => {
      const ancestorId = entry[`${ancestorLevel}_id`];
      if (ancestorId && rawMapLocationData[ancestorId]) {
        if (!clusteredData[ancestorId]) {
          clusteredData[ancestorId] = copyLocation(
            rawMapLocationData[ancestorId],
          );
        }
        const ancestor = clusteredData[ancestorId];
        ancestor[ids] = union(ancestor[ids], entry[ids]);
      }
    };

    const indexOfMap = indexOfMapLevel(mapLevel);
    for (const [id, entry] of Object.entries(rawMapLocationData)) {
      const indexOfEntry = indexOfMapLevel(entry.geo_level);

      // Have a bubble if you're higher than or at the map's geo level.
      if (indexOfEntry <= indexOfMap && !clusteredData[entry.id]) {
        clusteredData[id] = copyLocation(entry);
      }

      MAP_CLUSTER_ENABLED_LEVELS.forEach(ancestorLevel => {
        // If you have ancestors higher than or at the map's level, add your samples/projects to
        // their bubble.
        if (indexOfMapLevel(ancestorLevel) <= indexOfMap) {
          addToAncestor(entry, ancestorLevel);
        }
      });
    }

    // Remove ancestor bubbles that are now fully represented in sub-bubbles
    for (const [id, entry] of Object.entries(clusteredData)) {
      const indexOfEntry = indexOfMapLevel(entry.geo_level);
      if (indexOfEntry < indexOfMap && !entry.hasOwnEntries) {
        delete clusteredData[id];
      }
    }

    this.setState({ mapLocationData: clusteredData, mapLevel });
  };

  handleModalFirstTimeUserClose = () => {
    this.setState({
      emptyStateModalOpen: false,
    });
  };

  renderNoDataBanners = () => {
    const {
      currentTab,
      emptyStateModalOpen,
      filteredProjectCount,
      userDataCounts,
      projectId,
      search,
      visualizationCount,
    } = this.state;

    if (emptyStateModalOpen) {
      return (
        <ModalFirstTimeUser onClose={this.handleModalFirstTimeUserClose} />
      );
    }

    switch (currentTab) {
      case TAB_PROJECTS:
        if (!search && filteredProjectCount === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<ImgProjectsSecondary />}
                link={{
                  href: SAMPLES_UPLOAD_URL,
                  text: "Upload your data",
                }}
                message="You will see your projects here after you upload data or when you are invited to a project."
                title="Projects"
                type="no_projects"
              />
            </div>
          );
        }
        break;
      case TAB_SAMPLES:
        if (userDataCounts?.sampleCount === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<ImgSamplesSecondary />}
                link={{
                  href: SAMPLES_UPLOAD_URL,
                  text: "Upload your data",
                }}
                message={`You will see your samples here after you upload data ${
                  projectId
                    ? "to your project"
                    : "or when you are invited to a project"
                }.`}
                title="Samples"
                type="no_samples"
              />
            </div>
          );
        }
        break;
      case TAB_VISUALIZATIONS:
        if (visualizationCount === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<ImgVizSecondary />}
                link={{
                  href: VISUALIZATIONS_DOC_LINK,
                  text: "Learn about Heatmaps",
                  external: true,
                }}
                message="You will see your saved Heatmaps and Phylogenetic Trees here. Create them on the Samples tab."
                title="Visualizations"
                type="no_visualizations"
              />
            </div>
          );
        }
        break;
    }
    return null;
  };

  getNoDataBannerMessage = (pipelineLabel: string) => {
    return `No samples were processed by the ${pipelineLabel} Pipeline.`;
  };

  getNoDataLinks = (pluralizedPipelineLabel: string) => {
    return [
      {
        href: SAMPLES_UPLOAD_URL,
        text: `Run ${pluralizedPipelineLabel}`,
      },
    ];
  };

  renderNoDataWorkflowBanner = () => {
    const { workflow } = this.state;
    const { bannerTitle, noDataLinks, noDataMessage } =
      this.configForWorkflow?.[workflow];

    return (
      <InfoBanner
        className={cs.noResultsContainer}
        icon={<ImgSamplesSecondary />}
        link={noDataLinks}
        message={noDataMessage}
        title={`0 ${bannerTitle}`}
        type={workflow}
      />
    );
  };

  getNoSearchResultsBannerData = (type: string) => {
    let bannerData = {
      searchType: "",
      icon: null,
      listenerLink: {
        text: "",
        tabToSwitchTo: "",
      },
    };

    switch (type) {
      case TAB_PROJECTS:
        bannerData = {
          searchType: "Project",
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          icon: <ImgProjectsSecondary />,
          listenerLink: {
            text: "Or view Sample results",
            tabToSwitchTo: TAB_SAMPLES,
          },
        };
        break;
      case TAB_SAMPLES:
        bannerData = {
          searchType: "Sample",
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          icon: <ImgSamplesSecondary />,
          listenerLink: {
            text: "Or view Project results",
            tabToSwitchTo: TAB_PROJECTS,
          },
        };
        break;
      case TAB_VISUALIZATIONS:
        bannerData = {
          searchType: "Visualization",
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          icon: <ImgVizSecondary />,
          listenerLink: {
            text: "Or view Sample results",
            tabToSwitchTo: TAB_SAMPLES,
          },
        };
        break;
      default:
        logError({
          message:
            "DiscoveryView: Invalid type passed into getNoSearchResultsBannerData(). ",
          details: { type },
        });
        break;
    }

    const { searchType, icon, listenerLink } = bannerData;
    return {
      searchType,
      icon,
      listenerLink: {
        text: listenerLink.text,
        onClick: () => this.handleTabChange(listenerLink.tabToSwitchTo),
      },
    };
  };

  renderNoSearchResultsBanner = (type: string) => {
    const { searchType, icon, listenerLink } =
      this.getNoSearchResultsBannerData(type);

    return (
      <NoSearchResultsBanner
        searchType={searchType}
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        icon={icon}
        listenerLink={listenerLink}
        className={cs.noResultsContainer}
      />
    );
  };

  renderWorkflowTabs = () => {
    const { workflow } = this.state;
    const workflowTabValues = this.computeWorkflowTabs().map(tab => tab.value);
    const tabIndex = workflowTabValues.findIndex(
      workflowTabValue => workflowTabValue === workflow,
    );

    return (
      <div className={cs.workflowTabs}>
        {/* @ts-expect-error SDS is working on a fix for this in v19.0.1  */}
        <Tabs
          sdsSize="small"
          value={tabIndex}
          onChange={(_, selectedTabIndex) =>
            this.handleWorkflowTabChange(selectedTabIndex)
          }
        >
          {this.computeWorkflowTabs().map(tab => tab.label)}
        </Tabs>
      </div>
    );
  };

  resetWorkflowDataOnTabChange = (workflow: WorkflowType) => {
    switch (workflow) {
      case WorkflowType.AMR:
        this.amrWorkflowRuns.reset({
          conditions: this.getConditionsWithSessionStorage(
            TAB_SAMPLES,
            WorkflowType.AMR,
          ),
          loadFirstPage: true,
        });
        break;
      case WorkflowType.BENCHMARK:
        this.benchmarkWorkflowRuns.reset({
          conditions: this.getConditionsWithSessionStorage(
            TAB_SAMPLES,
            WorkflowType.BENCHMARK,
          ),
          loadFirstPage: true,
        });
        break;
    }

    this.resetSamplesView();
  };

  handleWorkflowTabChange = (workflowTabIndex: number) => {
    let { currentDisplay } = this.state;
    const { currentTab } = this.state;

    const workflow = this.computeWorkflowTabs()[workflowTabIndex].value;
    const isWorkflowRunTab = workflowIsWorkflowRunEntity(workflow);

    // PLQC is currently only available for short read mNGS samples
    const plqcWorkflows = [WorkflowType.SHORT_READ_MNGS as typeof workflow];
    if (currentDisplay === DISPLAY_PLQC && !plqcWorkflows.includes(workflow)) {
      currentDisplay = "table";
    }

    this.setState(
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      {
        currentDisplay,
        ...(!isWorkflowRunTab && {
          selectableSampleIds:
            this.configForWorkflow[workflow].getSelectableIds(),
        }),
        workflow,
        workflowEntity: WORKFLOWS[workflow].entity,
        ...this.getOrderStateFieldsFor(currentTab, workflow),
      },
      () => {
        this.updateBrowsingHistory("replace");

        // Refresh data when switching to the AMR or Benchmark tabs
        // User can kickoff AMR from existing short-read-mngs samples
        // Admins can also benchmark one or more existing mGNS samples
        this.resetWorkflowDataOnTabChange(workflow);
      },
    );
  };

  computeWorkflowTabs = () => {
    const { allowedFeatures, isAdmin, snapshotShareId } = this.props;

    // Only short-read-mngs
    if (snapshotShareId) {
      return [this.getWorkflowTab(WorkflowType.SHORT_READ_MNGS)];
    }

    return [
      this.getWorkflowTab(WorkflowType.SHORT_READ_MNGS),
      this.getWorkflowTab(WorkflowType.LONG_READ_MNGS),
      this.getWorkflowTab(
        WorkflowType.CONSENSUS_GENOME,
        this.props.cgWorkflowIds?.length,
      ),
      this.getWorkflowTab(WorkflowType.AMR),
      ...(isAdmin || allowedFeatures.includes(BENCHMARKING_FEATURE)
        ? [this.getWorkflowTab(WorkflowType.BENCHMARK)]
        : []),
    ];
  };

  getWorkflowTab = (workflow: WorkflowType, count?: number) => {
    const workflowName = `${WORKFLOWS[workflow].pluralizedLabel}`;

    let workflowCount: number | string =
      this.state.filteredSampleCountsByWorkflow[workflow];

    // This count is set to null when we reset data, so show "-" as loading state.
    // This is the same pattern used for the top level tabs.
    if (workflowCount === null) workflowCount = "-";

    return {
      label: (
        <Tab
          key={nanoid()}
          data-testid={workflowName.toLowerCase().replace(/ /g, "-")}
          label={workflowName}
          count={
            <span
              data-testid={`${workflowName
                .toLowerCase()
                .replace(/ /g, "-")}-count`}
            >
              {count ?? workflowCount ?? "0"}
            </span>
          }
        />
      ),
      value: workflow,
    };
  };

  handleNewWorkflowRunsCreated = ({
    numWorkflowRunsCreated,
    workflow,
  }: {
    numWorkflowRunsCreated: number;
    workflow: WorkflowType;
  }) => {
    // When workflow runs are kicked off from existing samples, we need to update the counts appropriately
    this.setState(
      ({
        workflowCounts: prevWorkflowCounts,
        filteredSampleCountsByWorkflow: prevFilteredSampleCountsByWorkflow,
      }) => {
        const prevFilteredSampleCountForWorkflow =
          prevFilteredSampleCountsByWorkflow[workflow];
        const newFilteredWorkflowRunsCount =
          prevFilteredSampleCountForWorkflow + numWorkflowRunsCreated;
        const prevUnfilteredWorkflowCount: number =
          prevWorkflowCounts?.[workflow] || 0;
        const newUnfilteredWorkflowCount =
          prevUnfilteredWorkflowCount + numWorkflowRunsCreated;

        return {
          workflowCounts: {
            ...prevWorkflowCounts,
            [workflow]: newUnfilteredWorkflowCount,
          },
          filteredSampleCountsByWorkflow: {
            ...prevFilteredSampleCountsByWorkflow,
            [workflow]: newFilteredWorkflowRunsCount,
          },
        };
      },
    );
  };

  renderCenterPaneContent = () => {
    const {
      currentDisplay,
      currentTab,
      filteredProjectCount,
      filters,
      mapLevel,
      mapLocationData,
      mapPreviewedLocationId,
      projectId,
      sampleActiveColumnsByWorkflow,
      selectableSampleIds,
      selectedSampleIdsByWorkflow,
      showFilters,
      showStats,
      orderBy,
      orderDirection,
      userDataCounts,
      workflow,
      workflowEntity,
      workflowCounts,
    } = this.state;

    const {
      isAdmin,
      domain,
      mapTilerKey,
      snapshotShareId,
      workflowRunsProjectAggregates,
      fetchWorkflowRunsProjectAggregates,
      allowedFeatures,
      cgWorkflowIds,
    } = this.props;

    const { projects, visualizations } = this;

    const isWorkflowRunEntity =
      workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;

    const tableHasLoaded =
      !this.amrWorkflowRuns.isLoading() &&
      !this.benchmarkWorkflowRuns.isLoading() &&
      !this.longReadMngsSamples.isLoading() &&
      cgWorkflowIds !== undefined &&
      !this.samples.isLoading() &&
      currentDisplay === "table";

    const hideAllTriggers = !!snapshotShareId;

    const selectableIds = isWorkflowRunEntity
      ? this.configForWorkflow[workflow].getSelectableIds()
      : selectableSampleIds;
    const selectedIds = selectedSampleIdsByWorkflow[workflow];
    const updateSelectedIds = this.handleSelectedSamplesUpdate;

    // TODO: verify if sorting works for AMR
    const sortable =
      allowedFeatures.includes(SORTING_V0_ADMIN_FEATURE) ||
      domain === DISCOVERY_DOMAIN_MY_DATA;

    // Note: If the user has not defined an ordered table column in the given session,
    // we update the UI to indicate default sort behavior but do not update session storage.
    const orderNotDefined = isUndefined(orderBy) || isNull(orderBy);
    const orderByForCurrentTab = orderNotDefined
      ? DEFAULT_SORTED_COLUMN_BY_TAB[currentTab]
      : orderBy;

    // If showAllMetadata is true, all metadata (including custom metadata) will be available.
    // If showAllMetadata is false, only a subset of metadata will be available. (Refer to fixedMetadata in ColumnConfigurations.jsx.)
    const showAllMetadata =
      allowedFeatures.includes(SAMPLES_TABLE_METADATA_COLUMNS_ADMIN_FEATURE) ||
      domain === DISCOVERY_DOMAIN_MY_DATA;

    const hasAtLeastOneFilterApplied = some(
      filter => !isEmpty(filter),
      Object.values(prepareFilters(filters)),
    );
    return (
      <>
        {currentTab === TAB_PROJECTS && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              <ProjectsView
                currentDisplay={currentDisplay}
                currentTab={currentTab}
                fetchWorkflowRunsProjectAggregates={(projectIds: number[]) => {
                  fetchWorkflowRunsProjectAggregates(
                    projectIds,
                    this.getConditionsWithSessionStorage(TAB_PROJECTS),
                  );
                }}
                filteredProjectCount={filteredProjectCount}
                hasAtLeastOneFilterApplied={hasAtLeastOneFilterApplied}
                mapLevel={mapLevel}
                mapLocationData={mapLocationData}
                mapPreviewedLocationId={mapPreviewedLocationId}
                mapTilerKey={mapTilerKey}
                onClearFilters={this.handleClearFilters}
                onDisplaySwitch={this.handleDisplaySwitch}
                onLoadRows={projects.handleLoadObjectRows}
                onMapClick={this.clearMapPreview}
                onMapLevelChange={this.handleMapLevelChange}
                onMapMarkerClick={this.handleMapMarkerClick}
                onProjectSelected={this.handleProjectSelected}
                onMapTooltipTitleClick={this.handleMapTooltipTitleClick}
                onSortColumn={this.handleSortColumn}
                projects={projects}
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                ref={projectsView => (this.projectsView = projectsView)}
                sortBy={orderByForCurrentTab}
                sortDirection={orderDirection}
                sortable={sortable}
                totalNumberOfProjects={userDataCounts?.projectCount}
                workflowRunsProjectAggregates={workflowRunsProjectAggregates}
              />
            </div>
            {projects &&
              !projects.isLoading() &&
              currentDisplay === "table" &&
              filteredProjectCount === 0 &&
              this.renderNoSearchResultsBanner(TAB_PROJECTS)}
          </div>
        )}
        {currentTab === TAB_SAMPLES && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              {currentDisplay !== "map" && this.renderWorkflowTabs()}
              {workflowCounts && !workflowCounts[workflow] ? (
                this.renderNoDataWorkflowBanner()
              ) : (
                <SamplesView
                  activeColumns={sampleActiveColumnsByWorkflow[workflow]}
                  admin={isAdmin}
                  currentDisplay={currentDisplay}
                  currentTab={currentTab}
                  domain={domain}
                  filters={prepareFilters(filters)}
                  getRows={this.configForWorkflow[workflow].getRows}
                  hasAtLeastOneFilterApplied={hasAtLeastOneFilterApplied}
                  mapLevel={mapLevel}
                  mapLocationData={mapLocationData}
                  mapPreviewedLocationId={mapPreviewedLocationId}
                  mapTilerKey={mapTilerKey}
                  onActiveColumnsChange={this.handleSampleActiveColumnsChange}
                  onClearFilters={this.handleClearFilters}
                  onDeleteSample={this.resetDataFromFilterChange}
                  onDisplaySwitch={this.handleDisplaySwitch}
                  onLoadRows={this.configForWorkflow[workflow].fetchPage}
                  onPLQCHistogramBarClick={this.handlePLQCHistogramBarClick}
                  onMapClick={this.clearMapPreview}
                  onMapLevelChange={this.handleMapLevelChange}
                  onMapMarkerClick={this.handleMapMarkerClick}
                  onMapTooltipTitleClick={this.handleMapTooltipTitleClick}
                  onObjectSelected={this.handleObjectSelected}
                  onSortColumn={this.handleSortColumn}
                  projectId={projectId}
                  snapshotShareId={snapshotShareId}
                  sortable={sortable}
                  ref={this.samplesView}
                  selectableIds={selectableIds}
                  selectedIds={selectedIds}
                  showAllMetadata={showAllMetadata}
                  sortBy={orderByForCurrentTab}
                  sortDirection={orderDirection}
                  onUpdateSelectedIds={updateSelectedIds}
                  handleNewWorkflowRunsCreated={
                    this.handleNewWorkflowRunsCreated
                  }
                  filtersSidebarOpen={showFilters}
                  sampleStatsSidebarOpen={showStats}
                  hideAllTriggers={hideAllTriggers}
                  totalWorkflowCounts={workflowCounts}
                  workflow={workflow}
                  workflowEntity={workflowEntity}
                />
              )}
            </div>
            {workflowCounts &&
            workflowCounts[workflow] &&
            this.configForWorkflow[workflow].getFilteredSampleCount() === 0 &&
            tableHasLoaded
              ? this.renderNoSearchResultsBanner(TAB_SAMPLES)
              : null}
          </div>
        )}
        {currentTab === TAB_VISUALIZATIONS && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              <VisualizationsView
                currentDisplay={currentDisplay}
                visualizations={visualizations}
                onLoadRows={visualizations.handleLoadObjectRows}
                onSortColumn={this.handleSortColumn}
                ref={visualizationsView =>
                  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                  (this.visualizationsView = visualizationsView)
                }
                sortBy={orderByForCurrentTab}
                sortDirection={orderDirection}
                sortable={sortable}
              />
            </div>
            {visualizations &&
              !visualizations.length &&
              !visualizations.isLoading() &&
              currentDisplay === "table" &&
              this.renderNoSearchResultsBanner(TAB_VISUALIZATIONS)}
          </div>
        )}
      </>
    );
  };

  renderRightPane = () => {
    const { allowedFeatures, domain } = this.props;
    const {
      currentDisplay,
      currentTab,
      filteredProjectCount,
      filteredProjectDimensions,
      filteredSampleCountsByWorkflow,
      filteredSampleDimensions,
      filteredSampleStats,
      loadingDimensions,
      loadingStats,
      mapPreviewedLocationId,
      mapSidebarProjectCount,
      mapSidebarProjectDimensions,
      mapSidebarSampleCount,
      mapSidebarSampleDimensions,
      mapSidebarSampleStats,
      selectedSampleIdsByWorkflow,
      mapSidebarTab,
      plqcPreviewedSamples,
      projectDimensions,
      project,
      sampleDimensions,
      search,
      showStats,
      userDataCounts,
    } = this.state;
    const { snapshotShareId, snapshotProjectDescription } = this.props;

    const filterCount = this.getFilterCount();
    const computedProjectDimensions =
      filterCount || search ? filteredProjectDimensions : projectDimensions;
    const computedSampleDimensions =
      filterCount || search ? filteredSampleDimensions : sampleDimensions;
    const loading = loadingDimensions || loadingStats;
    const selectedMngsSampleIds =
      selectedSampleIdsByWorkflow[WorkflowType.SHORT_READ_MNGS];

    const filteredMngsSampleCount =
      filteredSampleCountsByWorkflow[WorkflowType.SHORT_READ_MNGS];
    return (
      <div className={cs.rightPane}>
        {showStats &&
          currentTab !== TAB_VISUALIZATIONS &&
          (currentDisplay !== "table" ? (
            <MapPreviewSidebar
              allowedFeatures={allowedFeatures}
              currentTab={mapSidebarTab}
              discoveryCurrentTab={currentTab}
              loading={loading}
              onFilterClick={this.handleMetadataFilterClick}
              onProjectSelected={this.handleProjectSelected}
              onSampleClicked={this.handleObjectSelected}
              onSelectionUpdate={this.handleSelectedSamplesUpdate}
              onTabChange={this.handleMapSidebarTabChange}
              projectDimensions={
                !mapPreviewedLocationId
                  ? computedProjectDimensions
                  : mapSidebarProjectDimensions
              }
              projects={this.mapPreviewProjects}
              projectStats={{
                count: !mapPreviewedLocationId
                  ? filteredProjectCount
                  : mapSidebarProjectCount,
              }}
              ref={mapPreviewSidebar =>
                // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
                (this.mapPreviewSidebar = mapPreviewSidebar)
              }
              sampleDimensions={
                !mapPreviewedLocationId && !plqcPreviewedSamples
                  ? computedSampleDimensions
                  : mapSidebarSampleDimensions
              }
              samples={this.mapPreviewSamples}
              sampleStats={
                !mapPreviewedLocationId && !plqcPreviewedSamples
                  ? {
                      ...filteredSampleStats,
                      count: filteredMngsSampleCount,
                    }
                  : {
                      ...mapSidebarSampleStats,
                      count: mapSidebarSampleCount,
                    }
              }
              selectedSampleIds={selectedMngsSampleIds}
            />
          ) : (
            <DiscoverySidebar
              allowedFeatures={allowedFeatures}
              currentTab={currentTab}
              noDataAvailable={Boolean(
                domain === DISCOVERY_DOMAIN_MY_DATA &&
                  userDataCounts &&
                  !userDataCounts.projectCount,
              )}
              loading={loading}
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
              onFilterClick={
                // Re-enable when LocationFilter is supported.
                domain !== DISCOVERY_DOMAIN_SNAPSHOT &&
                this.handleMetadataFilterClick
              }
              projectDimensions={computedProjectDimensions}
              projectStats={
                // if no filtered samples are present, setting the project count to null
                // will display the no results sidebar
                domain === DISCOVERY_DOMAIN_SNAPSHOT
                  ? { count: filteredMngsSampleCount ? 1 : null }
                  : { count: filteredProjectCount }
              }
              sampleDimensions={computedSampleDimensions}
              sampleStats={{
                ...filteredSampleStats,
                count: filteredSampleStats.count,
              }}
              project={
                !snapshotShareId
                  ? project
                  : {
                      editable: false,
                      description: snapshotProjectDescription,
                    }
              }
              onProjectDescriptionSave={this.handleProjectDescriptionSave}
            />
          ))}
      </div>
    );
  };

  render() {
    const {
      currentDisplay,
      currentTab,
      filters,
      project,
      projectId,
      search,
      showFilters,
      showStats,
      userDataCounts,
      workflow,
    } = this.state;
    const { allowedFeatures, domain, snapshotProjectName } = this.props;

    const tabs = this.computeTabs();
    const dimensions = this.getCurrentDimensions();
    const filterCount = this.getFilterCount();
    const onBenchmarkingTab =
      currentTab === TAB_SAMPLES && workflow === WorkflowType.BENCHMARK;
    const displayFilters = onBenchmarkingTab
      ? false
      : showFilters && !!dimensions;
    return (
      <div className={cs.layout}>
        <div className={cs.headerContainer}>
          {projectId && (
            <ProjectHeader
              project={project || {}}
              snapshotProjectName={snapshotProjectName}
              onProjectUpdated={this.handleProjectUpdated}
              onMetadataUpdated={this.refreshDataFromProjectChange}
              workflow={workflow}
            />
          )}
          <DiscoveryHeader
            currentTab={currentTab}
            domain={domain}
            filterCount={filterCount}
            onFilterToggle={this.handleFilterToggle}
            onStatsToggle={this.handleStatsToggle}
            onSearchTriggered={this.handleSearchTriggered}
            onSearchResultSelected={this.handleSearchSelected}
            onSearchEnterPressed={this.handleStringSearch}
            onTabChange={this.handleTabChange}
            searchValue={search || ""}
            showStats={showStats && !!dimensions}
            showFilters={displayFilters}
            tabs={tabs}
            workflow={workflow}
            projectId={projectId}
          />
        </div>
        <Divider style="medium" />
        <div className={cs.mainContainer}>
          <div className={cs.leftPane}>
            {displayFilters && (
              <DiscoveryFilters
                {...mapValues(
                  (dim: Dimension) => dim.values,
                  keyBy("dimension", dimensions),
                )}
                {...filters}
                currentTab={currentTab}
                domain={domain}
                onFilterChange={this.handleFilterChange}
                allowedFeatures={allowedFeatures}
                workflow={workflow}
              />
            )}
          </div>
          <div className={cs.centerPane}>
            {userDataCounts &&
              (currentDisplay === "map" &&
              [TAB_SAMPLES, TAB_PROJECTS].includes(currentTab) ? (
                <div className={cs.viewContainer}>
                  {(domain === DISCOVERY_DOMAIN_MY_DATA &&
                    this.renderNoDataBanners()) ||
                    this.renderCenterPaneContent()}
                </div>
              ) : (
                <NarrowContainer className={cs.viewContainer}>
                  {(domain === DISCOVERY_DOMAIN_MY_DATA &&
                    this.renderNoDataBanners()) ||
                    this.renderCenterPaneContent()}
                </NarrowContainer>
              ))}
            {domain === DISCOVERY_DOMAIN_SNAPSHOT && (
              <NarrowContainer className={cs.viewContainer}>
                {this.renderNoDataBanners() || this.renderCenterPaneContent()}
              </NarrowContainer>
            )}
          </div>
          {this.renderRightPane()}
        </div>
      </div>
    );
  }
}

// Using a function component wrapper provides a semi-hacky way to
// access useContext without the class component to function component
// conversion.  We should move this when we refactor DiscoveryView
interface DiscoveryViewWithFCProps extends DiscoveryViewProps {
  allowedFeatures: string[];
  isAdmin: boolean;
  updateDiscoveryProjectId: (projectIds: string | null) => void;
  // NextGen props:
  cgWorkflowIds?: string[];
  cgRows: Array<CgRow | undefined>;
  workflowRunsProjectAggregates?: ProjectCountsType;
  fetchTotalWorkflowCounts: (
    selectedProjectId?: string,
  ) => Promise<WorkflowCount | undefined>;
  fetchCgPage: (offset: number) => Promise<Array<CgRow | undefined>>;
  fetchNextGenWorkflowRuns: (
    conditions: Conditions,
    sortOnlyWorkflow?: WorkflowType,
  ) => void;
  fetchWorkflowRunsProjectAggregates: (
    projectIds: number[],
    conditions: Conditions,
  ) => void;
}
