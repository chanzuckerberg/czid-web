import {
  capitalize,
  clone,
  compact,
  concat,
  escapeRegExp,
  find,
  get as _get,
  getOr,
  isEmpty,
  isNull,
  isUndefined,
  keyBy,
  map,
  mapKeys,
  mapValues,
  merge,
  partition,
  pick,
  replace,
  sumBy,
  union,
  values,
  xor,
  xorBy,
} from "lodash/fp";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import { getSearchSuggestions } from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  trackPageTransition,
} from "~/api/analytics";
import { get } from "~/api/core";
import { UserContext } from "~/components/common/UserContext";
import { Divider } from "~/components/layout";
import NarrowContainer from "~/components/layout/NarrowContainer";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import {
  SAMPLES_TABLE_METADATA_COLUMNS_FEATURE,
  SORTING_V0_ADMIN_FEATURE,
  SORTING_V0_FEATURE,
  TAXON_THRESHOLD_FILTERING_FEATURE,
} from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import { generateUrlToSampleView } from "~/components/utils/urls";
import {
  WORKFLOWS,
  WORKFLOW_ENTITIES,
  WORKFLOW_ORDER,
} from "~/components/utils/workflows";
import { MAP_CLUSTER_ENABLED_LEVELS } from "~/components/views/discovery/mapping/constants";
import { indexOfMapLevel } from "~/components/views/discovery/mapping/utils";
import { DEFAULTS_BY_WORKFLOW } from "~/components/views/samples/SamplesView/ColumnConfiguration";
import { publicSampleNotificationsByProject } from "~/components/views/samples/notifications";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import Tabs from "~ui/controls/Tabs";
import ImgProjectsSecondary from "~ui/illustrations/ImgProjectsSecondary";
import ImgSamplesSecondary from "~ui/illustrations/ImgSamplesSecondary";
import ImgVizSecondary from "~ui/illustrations/ImgVizSecondary";

import { VISUALIZATIONS_DOC_LINK } from "~utils/documentationLinks";
import { openUrl } from "~utils/links";

import ProjectsView from "../projects/ProjectsView";
import SamplesView from "../samples/SamplesView/SamplesView";
import VisualizationsView from "../visualizations/VisualizationsView";
import { DiscoveryDataLayer } from "./DiscoveryDataLayer";
import DiscoveryFilters from "./DiscoveryFilters";
import DiscoveryHeader from "./DiscoveryHeader";
import DiscoverySidebar from "./DiscoverySidebar";
import InfoBanner from "./InfoBanner";
import ModalFirstTimeUser from "./ModalFirstTimeUser";
import NoSearchResultsBanner from "./NoSearchResultsBanner";
import ProjectHeader from "./ProjectHeader";
import {
  KEY_DISCOVERY_SESSION_FILTERS,
  KEY_DISCOVERY_VIEW_OPTIONS,
} from "./constants";
import {
  getDiscoveryDimensions,
  getDiscoveryLocations,
  getDiscoveryStats,
  getDiscoveryVisualizations,
  DISCOVERY_DOMAINS,
  DISCOVERY_DOMAIN_ALL_DATA,
  DISCOVERY_DOMAIN_MY_DATA,
  DISCOVERY_DOMAIN_PUBLIC,
  DISCOVERY_DOMAIN_SNAPSHOT,
} from "./discovery_api";

import cs from "./discovery_view.scss";
import MapPreviewSidebar from "./mapping/MapPreviewSidebar";

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

const TAB_PROJECTS = "projects";
const TAB_SAMPLES = "samples";
const TAB_VISUALIZATIONS = "visualizations";
const CURRENT_TAB_OPTIONS = [TAB_PROJECTS, TAB_SAMPLES, TAB_VISUALIZATIONS];
const DEFAULT_ORDER_BY_TAB = {
  [TAB_PROJECTS]: "created_at",
  [TAB_SAMPLES]: "createdAt",
  [TAB_VISUALIZATIONS]: "updated_at",
};
class DiscoveryView extends React.Component {
  // used to preserve order keys across sessionStorage updates
  SESSION_ORDER_FIELD_KEYS = [
    this.getOrderByKeyFor(TAB_PROJECTS),
    this.getOrderDirKeyFor(TAB_PROJECTS),
    this.getOrderByKeyFor(TAB_SAMPLES, WORKFLOWS.CONSENSUS_GENOME.value),
    this.getOrderDirKeyFor(TAB_SAMPLES, WORKFLOWS.CONSENSUS_GENOME.value),
    this.getOrderByKeyFor(TAB_SAMPLES, WORKFLOWS.SHORT_READ_MNGS.value),
    this.getOrderDirKeyFor(TAB_SAMPLES, WORKFLOWS.SHORT_READ_MNGS.value),
    this.getOrderByKeyFor(TAB_VISUALIZATIONS),
    this.getOrderDirKeyFor(TAB_VISUALIZATIONS),
  ];

  constructor(props, context) {
    super(props, context);
    const { domain, projectId, updateDiscoveryProjectId } = this.props;

    this.urlParser = new UrlQueryParser({
      filters: "object",
      projectId: "number",
      showFilters: "boolean",
      showStats: "boolean",
    });

    const urlState = this.urlParser.parse(location.search);
    let sessionState = this.loadState(
      sessionStorage,
      KEY_DISCOVERY_VIEW_OPTIONS,
    );
    let localState = this.loadState(localStorage, KEY_DISCOVERY_VIEW_OPTIONS);

    const projectIdToUpdate = projectId || urlState.projectId;
    // If the projectId was passed as props or is in the URL, update the projectIds in the redux state via the updateProjectIds action creator
    updateDiscoveryProjectId(projectIdToUpdate || null);

    this.state = {
      currentDisplay: "table",
      currentTab:
        projectId || domain === DISCOVERY_DOMAIN_ALL_DATA
          ? TAB_SAMPLES
          : TAB_PROJECTS,
      emptyStateModalOpen: this.isFirstTimeUser(),
      filteredProjectCount: null,
      filteredProjectDimensions: [],
      filteredSampleCount: null,
      filteredSampleDimensions: [],
      filteredSampleStats: {},
      filteredVisualizationCount: null,
      filteredWorkflowRunCount: null,
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
      sampleActiveColumnsByWorkflow: undefined,
      sampleDimensions: [],
      search: null,
      selectableSampleIds: [],
      selectedSampleIds: new Set(),
      selectableWorkflowRunIds: [],
      selectedWorkflowRunIds: new Set(),
      showFilters: true,
      showStats: true,
      userDataCounts: null,
      workflow: WORKFLOWS.SHORT_READ_MNGS.value,
      workflowEntity: WORKFLOW_ENTITIES.SAMPLES,
      ...localState,
      ...sessionState,
      ...urlState,
    };

    // If a user had previously selected the PLQC view for a specific project,
    // ensure that currentDisplay defaults to "table" if they switch to a different view,
    // since the PLQC display only exists when viewing a single project.
    if (this.state.currentDisplay === "plqc" && !projectId) {
      this.state.currentDisplay = "table";
    }
    if (!this.state.sampleActiveColumnsByWorkflow) {
      this.state.sampleActiveColumnsByWorkflow = DEFAULTS_BY_WORKFLOW;
    }

    this.workflowEntity = find(
      { value: this.state.workflow },
      values(WORKFLOWS),
    ).entity;

    this.dataLayer = new DiscoveryDataLayer(domain);

    this.samples = this.dataLayer.samples.createView({
      conditions: this.getConditionsFor(
        TAB_SAMPLES,
        WORKFLOWS.SHORT_READ_MNGS.value,
      ),
      onViewChange: this.refreshSampleData,
      displayName: WORKFLOWS.SHORT_READ_MNGS.value,
    });

    this.workflowRuns = this.dataLayer.workflowRuns.createView({
      conditions: this.getConditionsFor(
        TAB_SAMPLES,
        WORKFLOWS.CONSENSUS_GENOME.value,
      ),
      onViewChange: this.refreshWorkflowRunData,
      displayName: WORKFLOWS.CONSENSUS_GENOME.value,
    });

    this.projects = this.dataLayer.projects.createView({
      conditions: this.getConditionsFor(TAB_PROJECTS),
      onViewChange: this.refreshProjectData,
      displayName: "ProjectsViewBase",
    });

    this.visualizations = this.dataLayer.visualizations.createView({
      conditions: this.getConditionsFor(TAB_VISUALIZATIONS),
      onViewChange: this.refreshVisualizationData,
      displayName: "VisualizationsViewBase",
    });

    this.mapPreviewProjects = this.projects;
    this.mapPreviewSamples = this.samples;

    // hold references to the views to allow resetting the tables
    this.projectsView = null;
    this.samplesView = null;
    this.mapPreviewSidebar = null;
    this.visualizationsView = null;

    // preload first pages
    this.samples.loadPage(0);
    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      this.projects.loadPage(0);
      this.workflowRuns.loadPage(0);
      this.visualizations.loadPage(0);
    }

    this.updateBrowsingHistory("replace");
  }

  async componentDidMount() {
    const { domain } = this.props;

    this.initialLoad();
    domain !== DISCOVERY_DOMAIN_SNAPSHOT && this.checkPublicSamples();

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

  loadState = (store, key) => {
    try {
      return JSON.parse(store.getItem(key)) || {};
    } catch (e) {
      // Avoid possible bad transient state related crash
      // eslint-disable-next-line no-console
      console.warn(`Bad state: ${e}`);
    }
    return {};
  };

  overwriteCGDefaultActiveColumns({ stateObject }) {
    const defaultCGColumns =
      DEFAULTS_BY_WORKFLOW[WORKFLOWS.CONSENSUS_GENOME.value];

    // eslint-disable-next-line standard/computed-property-even-spacing
    stateObject.sampleActiveColumnsByWorkflow[
      WORKFLOWS.CONSENSUS_GENOME.value
    ] = defaultCGColumns;
    stateObject["updatedAt"] = new Date();

    return stateObject;
  }

  getOrderKeyPrefix(tab, workflow) {
    // for samples, each workflow has its own order parameters
    return tab === TAB_SAMPLES ? `${tab}-${workflow}` : tab;
  }

  getOrderByKeyFor(tab, workflow = null) {
    return `${this.getOrderKeyPrefix(tab, workflow)}OrderBy`;
  }

  getCurrentTabOrderByKey() {
    const { currentTab, workflow } = this.state;
    return this.getOrderByKeyFor(currentTab, workflow);
  }

  getOrderDirKeyFor(tab, workflow = null) {
    return `${this.getOrderKeyPrefix(tab, workflow)}OrderDir`;
  }

  getCurrentTabOrderDirKey() {
    const { currentTab, workflow } = this.state;
    return this.getOrderDirKeyFor(currentTab, workflow);
  }

  getOrderStateFieldsFor = (tab, workflow = null) => {
    const sessionState = this.loadState(sessionStorage, "DiscoveryViewOptions");
    const orderBy = sessionState[`${this.getOrderByKeyFor(tab, workflow)}`];
    const orderDirection =
      sessionState[`${this.getOrderDirKeyFor(tab, workflow)}`];
    return { orderBy, orderDirection };
  };

  getDataLayerOrderStateFieldsFor = (tab, workflow = null) => {
    const { orderBy, orderDirection: orderDir } = this.getOrderStateFieldsFor(
      tab,
      workflow,
    );
    return { orderBy, orderDir };
  };

  updateBrowsingHistory = (action = "push") => {
    const { domain, snapshotShareId, updateDiscoveryProjectId } = this.props;
    const { currentTab, orderBy, orderDirection } = this.state;

    const { updatedAt: updatedAtFromLocalStorage } = this.loadState(
      localStorage,
      "DiscoveryViewOptions",
    );

    const currentSessionStorageState = this.loadState(
      sessionStorage,
      "DiscoveryViewOptions",
    );

    const {
      updatedAt: updatedAtFromSessionStorage,
    } = currentSessionStorageState;

    // prevent existing order fields from being removed from session storage
    const orderFieldsInSessionStorage = pick(
      this.SESSION_ORDER_FIELD_KEYS,
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
    !urlState.projectId && updateDiscoveryProjectId(urlState.projectId);

    // Saving on URL enables sharing current view with other users
    let urlQuery = this.urlParser.stringify(urlState);
    if (urlQuery) {
      urlQuery = `?${urlQuery}`;
    }
    let prefix = snapshotShareId ? this.getSnapshotPrefix() : `/${domain}`;

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
    const { firstSignIn } = this.context || {};
    return firstSignIn && !localStorage.getItem("DiscoveryViewSeenBefore");
  };

  preparedFilters = () => {
    const { allowedFeatures = [] } = this.context || {};
    const { filters } = this.state;
    let preparedFilters = mapKeys(replace("Selected", ""), filters);

    // Time is an exception: we translate values into date ranges
    if (preparedFilters.time) {
      const startDate = {
        "1_week": () => moment().subtract(7, "days"),
        "1_month": () => moment().subtract(1, "months"),
        "3_month": () => moment().subtract(3, "months"),
        "6_month": () => moment().subtract(6, "months"),
        "1_year": () => moment().subtract(1, "years"),
      };

      preparedFilters.time = [
        startDate[preparedFilters.time]().format("YYYYMMDD"),
        moment()
          .add(1, "days")
          .format("YYYYMMDD"),
      ];
    }

    // Taxon is an exception: this filter needs to store complete option, so need to convert to values only
    if (preparedFilters.taxon && preparedFilters.taxon.length) {
      let mapKey = "value";

      if (allowedFeatures.includes(TAXON_THRESHOLD_FILTERING_FEATURE)) {
        mapKey = "id";
        preparedFilters.taxaLevels = map("level", preparedFilters.taxon);
      }

      preparedFilters.taxon = map(mapKey, preparedFilters.taxon);
    }

    // Format threshold filter data for API query
    if (Array.isArray(preparedFilters.taxonThresholds)) {
      preparedFilters.taxonThresholds = preparedFilters.taxonThresholds.reduce(
        (result, threshold) => {
          const parsedMetric = threshold["metric"].split(":");

          // basic validation that the metric contains a valid count type and metric
          if (
            parsedMetric.length === 2 &&
            ["nt", "nr"].includes(parsedMetric[0])
          ) {
            const [countType, metric] = parsedMetric;
            const { operator, value } = threshold;
            result.push({
              metric,
              count_type: countType.toUpperCase(),
              operator,
              value,
            });
          }

          return result;
        },
        [],
      );
    }

    return preparedFilters;
  };

  resetData = ({ callback } = {}) => {
    const { domain } = this.props;
    const conditions = this.getConditions();

    this.samples.reset({
      conditions: this.getConditionsFor(
        TAB_SAMPLES,
        WORKFLOWS.SHORT_READ_MNGS.value,
      ),
      loadFirstPage: true,
    });

    if (domain !== DISCOVERY_DOMAIN_SNAPSHOT) {
      this.projects.reset({
        conditions: this.getConditionsFor(TAB_PROJECTS),
        loadFirstPage: true,
      });
      this.visualizations.reset({
        conditions: this.getConditionsFor(TAB_VISUALIZATIONS),
        loadFirstPage: true,
      });
      this.workflowRuns.reset({
        conditions: this.getConditionsFor(
          TAB_SAMPLES,
          WORKFLOWS.CONSENSUS_GENOME.value,
        ),
        loadFirstPage: true,
      });
    }
    if (this.mapPreviewSamples !== this.samples) {
      this.mapPreviewSamples.reset({ conditions, loadFirstPage: true });
    }
    if (this.mapPreviewProjects !== this.projects) {
      this.mapPreviewProjects.reset({ conditions, loadFirstPage: true });
    }

    this.setState(
      {
        filteredProjectCount: null,
        filteredProjectDimensions: [],
        filteredSampleCount: null,
        filteredSampleDimensions: [],
        filteredVisualizationCount: null,
        filteredSampleStats: {},
        filteredWorkflowRunCount: null,
        loadingDimensions: true,
        mapSidebarProjectCount: null,
        mapSidebarSampleCount: null,
        mapSidebarSampleStats: null,
      },
      () => {
        this.samplesView && this.samplesView.reset();
        this.projectsView && this.projectsView.reset();
        this.visualizationsView && this.visualizationsView.reset();
        callback && callback();
      },
    );
  };

  initialLoad = () => {
    const { project } = this.state;
    const { domain } = this.props;

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

  resetDataFromFilterChange = () => {
    const { domain } = this.props;
    this.resetData({
      callback: () => {
        // * On filter change:
        //   - load (B) filtered dimensions, (C) filtered stats, (D) filtered locations
        this.refreshFilteredDimensions();
        this.refreshFilteredStats();
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
      this.resetSamplesData();
    } else if (currentTab === TAB_PROJECTS) {
      this.resetProjectsData();
    } else if (currentTab === TAB_VISUALIZATIONS) {
      this.resetVisualizationsData();
    }
  };

  resetSamplesData = () => {
    const { workflow } = this.state;
    const conditions = this.getConditions();

    if (workflow === WORKFLOWS.SHORT_READ_MNGS.value) {
      this.samples.reset({
        conditions,
        loadFirstPage: true,
        logLoadTime: true,
      });
    } else if (workflow === WORKFLOWS.CONSENSUS_GENOME.value) {
      this.workflowRuns.reset({
        conditions,
        loadFirstPage: true,
        logLoadTime: true,
      });
    }

    this.samplesView && this.samplesView.reset();
  };

  resetProjectsData = () => {
    const conditions = this.getConditions();

    this.projects.reset({ conditions, loadFirstPage: true, logLoadTime: true });
    this.projectsView && this.projectsView.reset();
  };

  resetVisualizationsData = () => {
    const conditions = this.getConditions();

    this.visualizations.reset({
      conditions,
      loadFirstPage: true,
      logLoadTime: true,
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

    const {
      projectDimensions,
      sampleDimensions,
    } = await getDiscoveryDimensions({
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

  refreshFilteredStats = async () => {
    const { domain, snapshotShareId } = this.props;
    const { projectId, search } = this.state;

    this.setState({
      loadingStats: true,
    });

    const { sampleStats: filteredSampleStats } = await getDiscoveryStats({
      domain,
      projectId,
      snapshotShareId,
      filters: this.preparedFilters(),
      search,
    });

    this.setState({
      filteredSampleStats,
      loadingStats: false,
    });
  };

  refreshProjectData = () => {
    const { projectId } = this.state;

    this.setState({
      filteredProjectCount: this.projects.length,
      project: this.projects.get(projectId),
    });
  };

  refreshSampleData = () => {
    this.setState({
      filteredSampleCount: this.samples.length,
      selectableSampleIds: this.samples.getIds(),
    });
  };

  refreshVisualizationData = () => {
    this.setState({
      filteredVisualizationCount: this.visualizations.length,
    });
  };

  refreshWorkflowRunData = () => {
    this.setState({
      filteredWorkflowRunCount: this.workflowRuns.length,
      selectableWorkflowRunIds: this.workflowRuns.getIds(),
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
    const { projectId, search } = this.state;

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
      filters: this.preparedFilters(),
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
    const { mapLevel, projectId, search } = this.state;

    this.setState({
      loadingLocations: true,
    });

    const mapLocationData = await getDiscoveryLocations({
      domain,
      projectId,
      filters: this.preparedFilters(),
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
        plqcPreviewedSamples: null,
      },
      this.refreshPLQCPreviewedSamples,
    );
  };

  loadUserDataStats = async () => {
    const { domain } = this.props;
    const { projectId } = this.state;
    let { workflow } = this.state;

    this.setState({
      userDataCounts: null,
    });

    const [{ sampleStats }, { visualizations }] = await Promise.all([
      getDiscoveryStats({ domain, projectId }),
      getDiscoveryVisualizations({ domain }),
    ]);

    const numOfCgSamples = getOr(
      0,
      WORKFLOWS.CONSENSUS_GENOME.value,
      sampleStats.countByWorkflow,
    );
    const numOfMngsSamples = getOr(
      0,
      WORKFLOWS.SHORT_READ_MNGS.value,
      sampleStats.countByWorkflow,
    );
    if (numOfMngsSamples === 0 && numOfCgSamples > 0) {
      workflow = WORKFLOWS.CONSENSUS_GENOME.value;
    } else if (numOfCgSamples === 0 && numOfMngsSamples > 0) {
      workflow = WORKFLOWS.SHORT_READ_MNGS.value;
    }

    this.setState(
      {
        workflow,
        workflowEntity: find({ value: workflow }, values(WORKFLOWS)).entity,
        userDataCounts: {
          sampleCountByWorkflow: sampleStats.countByWorkflow,
          sampleCount: sampleStats.count,
          projectCount: sampleStats.projectCount,
          visualizationCount: visualizations.length || 0,
        },
      },
      () => {
        this.updateBrowsingHistory("replace");
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

    const renderTab = (label, count) => {
      return (
        <div>
          <span className={cs.tabLabel}>{label}</span>
          <span className={cs.tabCounter}>{count}</span>
        </div>
      );
    };
    return compact([
      !projectId && {
        label: renderTab("Projects", filteredProjectCount || "-"),
        value: TAB_PROJECTS,
      },
      {
        label: renderTab("Samples", filteredSampleStats.count || "-"),
        value: TAB_SAMPLES,
      },
      domain !== DISCOVERY_DOMAIN_PUBLIC &&
        !projectId && {
          label: renderTab("Visualizations", filteredVisualizationCount || "-"),
          value: TAB_VISUALIZATIONS,
        },
    ]);
  };

  handleTabChange = currentTab => {
    const { mapSidebarTab, workflow } = this.state;

    this.setState(
      {
        currentTab,
        ...this.getOrderStateFieldsFor(currentTab, workflow),
      },
      () => {
        this.updateBrowsingHistory("replace");
        const name = currentTab.replace(/\W+/g, "-").toLowerCase();
        trackEvent(`DiscoveryView_tab-${name}_clicked`, {
          currentTab: currentTab,
        });
      },
    );

    // Set to match 'samples' or 'projects'
    if (mapSidebarTab !== "summary") {
      this.setState({ mapSidebarTab: currentTab });
    }
  };

  handleFilterChange = selectedFilters => {
    this.setState({ filters: selectedFilters }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
      trackEvent(`DiscoveryView_filters_changed`, {
        filters: this.getFilterCount(),
      });
    });
  };

  handleSampleActiveColumnsChange = activeColumns => {
    const { workflow, sampleActiveColumnsByWorkflow } = this.state;

    const previousColumns = sampleActiveColumnsByWorkflow[workflow];
    sampleActiveColumnsByWorkflow[workflow] = activeColumns;
    this.setState({ sampleActiveColumnsByWorkflow }, () => {
      this.updateBrowsingHistory("replace");
      trackEvent(`DiscoveryView_columns_changed`, {
        newColumns: sampleActiveColumnsByWorkflow[workflow],
        previousColumns: previousColumns,
      });
    });
  };

  // From the right pane sidebar, we'll add the filter value they click on if not already selected.
  // Don't call this for single selection filters.
  handleMetadataFilterClick = (field, value) => {
    const { filters: selectedFilters } = this.state;

    const key = `${field}Selected`;
    if (selectedFilters[key]) {
      if (selectedFilters[key].includes(value)) return;
      selectedFilters[key].push(value);
    } else {
      selectedFilters[key] = [value];
    }

    this.handleFilterChange(selectedFilters);
  };

  handleSearchSelected = ({ key, value, text }, currentEvent) => {
    const { filters, search } = this.state;

    const dimensions = this.getCurrentDimensions();

    let newFilters = clone(filters);
    const selectedKey = `${key}Selected`;
    let filtersChanged = false;
    switch (key) {
      case "taxon": {
        // If the user selected a taxon we add it to the dropdown
        // (since we do know which options are available, we always added)
        newFilters[selectedKey] = xorBy(
          "value",
          [{ value, text }],
          newFilters[selectedKey],
        );
        filtersChanged = true;
        break;
      }
      case "sample": {
        this.handleObjectSelected({ object: { id: value }, currentEvent });
        break;
      }
      case "project": {
        this.handleProjectSelected({
          project: this.projects.get(value) || { id: value },
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
          search: null,
        },
        () => {
          this.updateBrowsingHistory("replace");
          this.resetDataFromFilterChange();
        },
      );
    }
    trackEvent("DiscoveryView_search_selected", {
      key,
      value,
      text,
      filtersChanged,
    });
  };

  handleStringSearch = search => {
    const { search: currentSearch } = this.state;

    let parsedSearch = (search && search.trim()) || null;
    if (currentSearch !== parsedSearch) {
      this.setState({ search: parsedSearch }, () => {
        this.updateBrowsingHistory("replace");
        this.resetDataFromFilterChange();
        trackEvent("DiscoveryView_string-search_entered", {
          search: parsedSearch,
        });
      });
    }
  };

  handleFilterToggle = () => {
    this.setState({ showFilters: !this.state.showFilters }, () => {
      this.updateBrowsingHistory("replace");
      trackEvent("DiscoveryView_show-filters_toggled", {
        showFilters: this.state.showFilters,
      });
    });
  };

  handleStatsToggle = () => {
    this.setState({ showStats: !this.state.showStats }, () => {
      this.updateBrowsingHistory("replace");
      trackEvent("DiscoveryView_show-stats_toggled", {
        showFilters: this.state.showStats,
      });
    });
  };

  getConditionsFor = (tab, workflow = null) => {
    return {
      ...this.getConditions(),
      ...this.getDataLayerOrderStateFieldsFor(tab, workflow),
    };
  };

  getConditions = () => {
    const { projectId, search, orderBy, orderDirection } = this.state;
    const { snapshotShareId } = this.props;

    return {
      projectId,
      snapshotShareId,
      search,
      orderBy,
      orderDir: orderDirection,
      filters: this.preparedFilters(),
    };
  };

  handleProjectSelected = ({ project }) => {
    const { mapSidebarTab, workflow } = this.state;
    const { updateDiscoveryProjectId } = this.props;

    this.setState(
      {
        currentDisplay: "table",
        currentTab: TAB_SAMPLES,
        mapSidebarTab:
          mapSidebarTab === "summary" ? mapSidebarTab : TAB_SAMPLES,
        projectId: project.id,
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

  handleObjectSelected = ({ object, currentEvent }) => {
    const { snapshotShareId, history: RouterHistory } = this.props;
    const { workflow, workflowEntity } = this.state;

    let sampleId;
    let workflowRunId;

    if (workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS) {
      sampleId = _get("sample.id", object);
      workflowRunId = object.id;
    } else {
      sampleId = _get("id", object);
    }

    let url = generateUrlToSampleView({
      workflow,
      sampleId,
      workflowRunId,
      snapshotShareId,
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

  handleProjectUpdated = ({ project }) => {
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

  getClientSideSuggestions = async query => {
    const dimensions = this.getCurrentDimensions();

    let suggestions = {};
    const re = new RegExp(escapeRegExp(query), "i");
    ["host", "tissue", "locationV2"].forEach(category => {
      let dimension = find({ dimension: category }, dimensions);
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

  getName = category => {
    if (category === "locationV2") {
      return "location";
    } else if (category === "tissue") {
      // It's too hard to rename all JS so we just rename here
      return "Sample Type";
    } else {
      return capitalize(category);
    }
  };

  handleProjectDescriptionSave = value => {
    this.setState({
      project: { ...this.state.project, description: value },
    });
  };

  getServerSideSuggestions = async query => {
    const { domain } = this.props;

    let results = await getSearchSuggestions({
      // NOTE: backend also supports "tissue", "location", "host" and more
      categories: ["sample", "project", "taxon"],
      query,
      domain,
    });
    return results;
  };

  handleSearchTriggered = async query => {
    const [clientSideSuggestions, serverSideSuggestions] = await Promise.all([
      // client side: for dimensions (host, location, tissue)
      this.getClientSideSuggestions(query),
      // server side: for taxa, projects and samples search (filter by domain)
      this.getServerSideSuggestions(query),
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

  handleDisplaySwitch = currentDisplay => {
    this.setState({ currentDisplay }, () => {
      this.updateBrowsingHistory("replace");
    });
  };

  handleMapTooltipTitleClick = locationId => {
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

  handleMapMarkerClick = locationId => {
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
        mapPreviewedLocationId: null,
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
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
        mapPreviewedLocationId: null,
        mapSidebarSampleCount: null,
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: {},
      });
    } else {
      let conditions = this.getConditions();
      conditions.filters.locationV2 = [
        mapLocationData[mapPreviewedLocationId].name,
      ];
      this.mapPreviewSamples = this.dataLayer.samples.createView({
        conditions,
        onViewChange: this.refreshMapSidebarSampleData,
        displayName: "MapPreviewSamplesView",
      });
      this.mapPreviewSamples.loadPage(0);
    }
  };

  handlePLQCHistogramBarClick = sampleIds => {
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
        displayName: "MapPreviewSamplesView",
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
        mapPreviewedLocationId: null,
        mapSidebarProjectCount: null,
        mapSidebarProjectDimensions: [],
      });
    } else {
      let conditions = this.getConditions();
      conditions.filters.locationV2 = [
        mapLocationData[mapPreviewedLocationId].name,
      ];
      this.mapPreviewProjects = this.dataLayer.projects.createView({
        conditions,
        onViewChange: this.refreshMapSidebarProjectData,
        displayName: "MapPreviewProjectsView",
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
    params.filters["locationV2"] = mapLocationData[mapPreviewedLocationId].name;
    const [
      { sampleStats },
      { projectDimensions, sampleDimensions },
    ] = await Promise.all([
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

  handleSelectedSamplesUpdate = selectedSampleIds =>
    this.setState({ selectedSampleIds });

  handleSelectedWorkflowRunsUpdate = selectedWorkflowRunIds =>
    this.setState({ selectedWorkflowRunIds });

  handleSortColumn = ({ sortBy, sortDirection }) => {
    const { domain } = this.props;
    const {
      currentTab,
      filteredSampleCount,
      filteredProjectCount,
      filteredVisualizationCount,
      filteredWorkflowRunCount,
      workflow,
    } = this.state;
    this.setState({ orderBy: sortBy, orderDirection: sortDirection }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromSortChange();

      trackEvent(
        ANALYTICS_EVENT_NAMES.DISCOVERY_VIEW_COLUMN_SORT_ARROW_CLICKED,
        {
          domain,
          currentTab,
          workflow,
          sortBy,
          sortDirection,
          filters: this.preparedFilters(),
          filteredSampleCount,
          filteredProjectCount,
          filteredVisualizationCount,
          filteredWorkflowRunCount,
        },
      );
    });
  };

  handleMapSidebarTabChange = mapSidebarTab => this.setState({ mapSidebarTab });

  handleClearFilters = () => {
    this.setState({ filters: {}, search: null }, () => {
      this.updateBrowsingHistory("replace");
      this.resetDataFromFilterChange();
    });
  };

  handleMapLevelChange = mapLevel => {
    const { rawMapLocationData, currentTab } = this.state;

    const ids = currentTab === TAB_SAMPLES ? "sample_ids" : "project_ids";
    const clusteredData = {};

    const copyLocation = entry => {
      return {
        ...entry,
        [ids]: Object.assign([], entry[ids]),
        hasOwnEntries: !isEmpty(entry[ids]),
      };
    };

    const addToAncestor = (entry, ancestorLevel) => {
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

  checkPublicSamples = () => {
    get("/samples/samples_going_public.json").then(res => {
      if ((res || []).length) this.displayPublicSampleNotifications(res);
    });
  };

  displayPublicSampleNotifications = samplesGoingPublic => {
    let previouslyDismissedSamples = new Set();
    try {
      previouslyDismissedSamples = new Set(
        JSON.parse(localStorage.getItem("dismissedPublicSamples")),
      );
    } catch (_) {
      // catch and ignore possible old formats
    }

    let [dismissedSamples, newSamples] = partition(
      sample => previouslyDismissedSamples.has(sample.id),
      samplesGoingPublic,
    );
    if (newSamples.length > 0) {
      // The purpose of setItem here is to keep the dismissed list from growing indefinitely. The
      // value here will no longer include samples that went public in the past.
      localStorage.setItem(
        "dismissedPublicSamples",
        JSON.stringify(map("id", dismissedSamples)),
      );
      publicSampleNotificationsByProject(newSamples);
    }
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
    } = this.state;

    if (!userDataCounts) return null;

    if (emptyStateModalOpen) {
      localStorage.setItem("DiscoveryViewSeenBefore", "1");
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
                  href: "/samples/upload",
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
        if (userDataCounts.sampleCount === 0) {
          return (
            <div className={cs.noDataBannerFlexContainer}>
              <InfoBanner
                className={cs.noDataBannerContainer}
                icon={<ImgSamplesSecondary />}
                link={{
                  href: "/samples/upload",
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
        if (userDataCounts.visualizationCount === 0) {
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

  renderNoDataWorkflowBanner = workflow => {
    const [workflowLabel, emptyTitle] =
      workflow === WORKFLOWS.SHORT_READ_MNGS.value
        ? [
            WORKFLOWS.SHORT_READ_MNGS.label,
            `${WORKFLOWS.SHORT_READ_MNGS.label} Samples`,
          ]
        : [
            WORKFLOWS.CONSENSUS_GENOME.label,
            `${WORKFLOWS.CONSENSUS_GENOME.label}s`,
          ];
    return (
      <InfoBanner
        className={cs.noResultsContainer}
        icon={<ImgSamplesSecondary />}
        link={{
          href: "/samples/upload",
          text: `Run ${workflowLabel}s`,
        }}
        message={`No samples were processed by the ${workflowLabel} Pipeline.`}
        title={`0 ${emptyTitle}`}
        type={workflow}
      />
    );
  };

  getNoSearchResultsBannerData = type => {
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

  renderNoSearchResultsBanner = type => {
    const {
      searchType,
      icon,
      listenerLink,
    } = this.getNoSearchResultsBannerData(type);

    return (
      <NoSearchResultsBanner
        searchType={searchType}
        icon={icon}
        listenerLink={listenerLink}
        className={cs.noResultsContainer}
      />
    );
  };

  renderWorkflowTabs = () => {
    const { workflow } = this.state;

    return (
      <Tabs
        className={cs.workflowTabs}
        tabs={this.computeWorkflowTabs()}
        value={workflow}
        onChange={this.handleWorkflowTabChange}
        hideBorder
      />
    );
  };

  handleWorkflowTabChange = workflow => {
    const view =
      workflow === WORKFLOWS.CONSENSUS_GENOME.value
        ? this.workflowRuns
        : this.samples;

    // PLQC is currently only available for mNGS samples.
    let { currentDisplay, currentTab } = this.state;
    currentDisplay =
      currentDisplay === "plqc" && workflow === WORKFLOWS.CONSENSUS_GENOME.value
        ? "table"
        : currentDisplay;

    this.setState(
      {
        currentDisplay,
        ...(workflow === WORKFLOWS.CONSENSUS_GENOME.value
          ? { selectableWorkflowRunIds: view.getIds() }
          : { selectableSampleIds: view.getIds() }),
        workflow,
        workflowEntity: find({ value: workflow }, values(WORKFLOWS)).entity,
        ...this.getOrderStateFieldsFor(currentTab, workflow),
      },
      () => {
        this.updateBrowsingHistory("replace");
        this.resetDataFromSortChange();
      },
    );
    trackEvent(`DiscoveryView_${workflow}-tab_clicked`);
  };

  computeWorkflowTabs = () => {
    const { snapshotShareId } = this.props;
    let workflows = WORKFLOW_ORDER;
    if (snapshotShareId) workflows = [workflows[0]]; // Only mngs

    return workflows.map(name => {
      const workflowName = `${WORKFLOWS[name].label}s`;
      const workflowCount =
        name === "CONSENSUS_GENOME"
          ? this.workflowRuns.length
          : this.samples.length;

      return {
        label: (
          <>
            <span className={cs.tabLabel}>{workflowName}</span>
            <span className={cs.tabCounter}>{workflowCount || "0"}</span>
          </>
        ),
        value: WORKFLOWS[name].value,
      };
    });
  };

  renderCenterPaneContent = () => {
    const {
      currentDisplay,
      currentTab,
      filteredProjectCount,
      mapLevel,
      mapLocationData,
      mapPreviewedLocationId,
      projectId,
      sampleActiveColumnsByWorkflow,
      selectableSampleIds,
      selectableWorkflowRunIds,
      selectedSampleIds,
      selectedWorkflowRunIds,
      showFilters,
      showStats,
      orderBy,
      orderDirection,
      userDataCounts,
      workflow,
      workflowEntity,
    } = this.state;

    const { admin, domain, mapTilerKey, snapshotShareId } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const { projects, visualizations } = this;

    const isWorkflowRunEntity =
      workflowEntity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;
    const objects = isWorkflowRunEntity ? this.workflowRuns : this.samples;
    const tableHasLoaded = !objects.isLoading() && currentDisplay === "table";

    const hideAllTriggers = !!snapshotShareId;
    const [selectableIds, selectedIds, updateSelectedIds] = isWorkflowRunEntity
      ? [
          selectableWorkflowRunIds,
          selectedWorkflowRunIds,
          this.handleSelectedWorkflowRunsUpdate,
        ]
      : [
          selectableSampleIds,
          selectedSampleIds,
          this.handleSelectedSamplesUpdate,
        ];

    const sortable =
      allowedFeatures.includes(SORTING_V0_ADMIN_FEATURE) ||
      (allowedFeatures.includes(SORTING_V0_FEATURE) &&
        domain === DISCOVERY_DOMAIN_MY_DATA);

    // Note: If the user has not defined an ordered table column in the given session,
    // we update the UI to indicate default sort behavior but do not update session storage.
    const orderNotDefined = isUndefined(orderBy) || isNull(orderBy);
    const orderByForCurrentTab = orderNotDefined
      ? DEFAULT_ORDER_BY_TAB[currentTab]
      : orderBy;

    // If showAllMetadata is true, all metadata (including custom metadata) will be available.
    // If showAllMetadata is false, only a subset of metadata will be available. (Refer to fixedMetadata in ColumnConfigurations.jsx.)
    const showAllMetadata =
      allowedFeatures.includes(SAMPLES_TABLE_METADATA_COLUMNS_FEATURE) &&
      domain === DISCOVERY_DOMAIN_MY_DATA;

    return (
      <>
        {currentTab === TAB_PROJECTS && (
          <div className={cs.tableContainer}>
            <div className={cs.dataContainer}>
              <ProjectsView
                allowedFeatures={allowedFeatures}
                currentDisplay={currentDisplay}
                currentTab={currentTab}
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
                ref={projectsView => (this.projectsView = projectsView)}
                sortBy={orderByForCurrentTab}
                sortDirection={orderDirection}
                sortable={sortable}
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
              {userDataCounts &&
              !userDataCounts.sampleCountByWorkflow[workflow] ? (
                this.renderNoDataWorkflowBanner(workflow)
              ) : (
                <SamplesView
                  activeColumns={sampleActiveColumnsByWorkflow[workflow]}
                  admin={admin}
                  allowedFeatures={allowedFeatures}
                  currentDisplay={currentDisplay}
                  currentTab={currentTab}
                  filters={this.preparedFilters()}
                  mapLevel={mapLevel}
                  mapLocationData={mapLocationData}
                  mapPreviewedLocationId={mapPreviewedLocationId}
                  mapTilerKey={mapTilerKey}
                  objects={objects}
                  onActiveColumnsChange={this.handleSampleActiveColumnsChange}
                  onClearFilters={this.handleClearFilters}
                  onDisplaySwitch={this.handleDisplaySwitch}
                  onLoadRows={objects.handleLoadObjectRows}
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
                  ref={samplesView => (this.samplesView = samplesView)}
                  selectableIds={selectableIds}
                  selectedIds={selectedIds}
                  showAllMetadata={showAllMetadata}
                  sortBy={orderByForCurrentTab}
                  sortDirection={orderDirection}
                  onUpdateSelectedIds={updateSelectedIds}
                  filtersSidebarOpen={showFilters}
                  sampleStatsSidebarOpen={showStats}
                  hideAllTriggers={hideAllTriggers}
                  workflow={workflow}
                  workflowEntity={workflowEntity}
                />
              )}
            </div>
            {userDataCounts &&
            userDataCounts.sampleCountByWorkflow[workflow] &&
            !this.samples.length &&
            !this.workflowRuns.length &&
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
    const { domain } = this.props;
    const { allowedFeatures = [] } = this.context || {};
    const {
      currentDisplay,
      currentTab,
      filteredProjectCount,
      filteredProjectDimensions,
      filteredSampleCount,
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
      selectedSampleIds,
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

    return (
      <div className={cs.rightPane}>
        {showStats &&
          currentTab !== TAB_VISUALIZATIONS &&
          (currentDisplay !== "table" ? (
            <MapPreviewSidebar
              allowedFeatures={allowedFeatures}
              currentTab={mapSidebarTab}
              discoveryCurrentTab={currentTab}
              domain={domain}
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
                      count: filteredSampleCount,
                    }
                  : {
                      ...mapSidebarSampleStats,
                      count: mapSidebarSampleCount,
                    }
              }
              selectedSampleIds={selectedSampleIds}
            />
          ) : (
            <DiscoverySidebar
              allowedFeatures={allowedFeatures}
              currentTab={currentTab}
              noDataAvailable={
                domain === DISCOVERY_DOMAIN_MY_DATA &&
                userDataCounts &&
                !userDataCounts.projectCount
              }
              loading={loading}
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
                  ? { count: filteredSampleCount ? 1 : null }
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
    const { domain, snapshotProjectName } = this.props;
    const { allowedFeatures = [] } = this.context || {};

    const tabs = this.computeTabs();
    const dimensions = this.getCurrentDimensions();
    const filterCount = this.getFilterCount();

    return (
      <div className={cs.layout}>
        <div className={cs.headerContainer}>
          {projectId && (
            <ProjectHeader
              project={project || {}}
              snapshotProjectName={snapshotProjectName}
              fetchedSamples={this.samples.loaded}
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
            onSearchSuggestionsReceived={this.handleSearchSuggestionsReceived}
            onSearchResultSelected={this.handleSearchSelected}
            onSearchEnterPressed={this.handleStringSearch}
            onTabChange={this.handleTabChange}
            searchValue={search || ""}
            showStats={showStats && !!dimensions}
            showFilters={showFilters && !!dimensions}
            tabs={tabs}
          />
        </div>
        <Divider style="medium" />
        <div className={cs.mainContainer}>
          <div className={cs.leftPane}>
            {showFilters && dimensions && (
              <DiscoveryFilters
                {...mapValues(
                  dim => dim.values,
                  keyBy("dimension", dimensions),
                )}
                {...filters}
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

DiscoveryView.propTypes = {
  admin: PropTypes.bool,
  domain: PropTypes.oneOf(DISCOVERY_DOMAINS).isRequired,
  history: PropTypes.object,
  mapTilerKey: PropTypes.string,
  projectId: PropTypes.number,
  snapshotProjectDescription: PropTypes.string,
  snapshotProjectName: PropTypes.string,
  snapshotShareId: PropTypes.string,
  updateDiscoveryProjectId: PropTypes.func,
};

DiscoveryView.contextType = UserContext;

const mapDispatchToProps = { updateDiscoveryProjectId: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(null, mapDispatchToProps)(DiscoveryView);

connectedComponent.name = "DiscoveryView";

export default withRouter(connectedComponent);
