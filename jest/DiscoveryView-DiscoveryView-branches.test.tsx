// Branch coverage for app/assets/src/components/views/DiscoveryView/DiscoveryView.tsx
//
// The existing DiscoveryView suite drives the component through the DOM, which
// exercises the happy path of the orchestration but leaves most of the decision
// points inside the class unvisited: the search-suggestion switch, the
// workflow-tab fallback chain, the map-preview guards, the "which sidebar
// count do I show" ternaries and the several `?? / || / &&` defaults.
//
// This suite goes at those directly. DiscoveryView is a class component, so we
// capture the mounted instance through a ref and call its methods with the
// exact state each branch needs, asserting on the value returned or the state /
// collaborator call that results. Everything still runs against a real mounted
// component, so the methods see a real `this.state`, real `configForWorkflow`
// and the real data-layer views.
import { render, waitFor } from "@testing-library/react";
import { WORKFLOW_ENTITIES, WorkflowType } from "~/components/utils/workflows";
import { DiscoveryView } from "~/components/views/DiscoveryView/DiscoveryView";
import {
  TAB_PROJECTS,
  TAB_SAMPLES,
  TAB_VISUALIZATIONS,
} from "~/components/views/DiscoveryView/constants";
import {
  getDiscoveryDimensions,
  getDiscoveryLocations,
  getDiscoveryStats,
  getDiscoveryVisualizations,
} from "~/components/views/DiscoveryView/discovery_api";
import { openUrl } from "~utils/links";

jest.mock("~/components/views/DiscoveryView/discovery_api", () => {
  const actual = jest.requireActual(
    "~/components/views/DiscoveryView/discovery_api",
  );
  return {
    ...actual,
    getDiscoveryDimensions: jest.fn(),
    getDiscoveryLocations: jest.fn(),
    getDiscoveryStats: jest.fn(),
    getDiscoveryVisualizations: jest.fn(),
  };
});

jest.mock("~/components/views/DiscoveryView/DiscoveryDataLayer", () => {
  const views: Record<string, $TSFixMe> = {};
  const makeCollection = (name: string) => ({
    createView: (opts: $TSFixMe) => {
      const view = {
        opts,
        loaded: [],
        length: 0,
        ids: [] as string[],
        loadPage: jest.fn(),
        reset: jest.fn(),
        isLoading: jest.fn(() => false),
        handleLoadObjectRows: jest.fn(async () => []),
        getIds: jest.fn(() => view.ids),
        get: jest.fn(() => undefined),
      };
      views[name] = view;
      return view;
    },
    update: jest.fn(),
  });
  class DiscoveryDataLayer {
    domain: string;
    samples = makeCollection("samples");
    projects = makeCollection("projects");
    visualizations = makeCollection("visualizations");
    amrWorkflowRuns = makeCollection("amrWorkflowRuns");
    benchmarkWorkflowRuns = makeCollection("benchmarkWorkflowRuns");
    longReadMngsSamples = makeCollection("longReadMngsSamples");
    constructor(domain: string) {
      this.domain = domain;
    }
  }
  return {
    __esModule: true,
    DiscoveryDataLayer,
    ObjectCollectionView: class {},
    __views: views,
  };
});

jest.mock("~/api", () => ({
  __esModule: true,
  getSearchSuggestions: jest.fn(async () => ({})),
}));
jest.mock("~/api/analytics", () => ({
  __esModule: true,
  trackPageTransition: jest.fn(),
  trackEvent: jest.fn(),
  useTrackEvent: () => jest.fn(),
  withAnalytics: (fn: $TSFixMe) => fn,
  ANALYTICS_EVENT_NAMES: new Proxy(
    {},
    { get: (_target, key) => String(key) },
  ) as $TSFixMe,
}));
jest.mock("~/components/views/SampleView/utils", () => ({
  __esModule: true,
  NOTIFICATION_TYPES: { sampleDeleteSuccess: "sampleDeleteSuccess" },
  showNotification: jest.fn(),
}));
jest.mock("~utils/links", () => ({
  __esModule: true,
  openUrl: jest.fn(),
}));

// --- child view stubs -------------------------------------------------------
jest.mock(
  "~/components/views/DiscoveryView/components/DiscoveryHeader",
  () => ({
    __esModule: true,
    DiscoveryHeader: () => <div data-testid="discovery-header" />,
  }),
);
jest.mock(
  "~/components/views/DiscoveryView/components/DiscoveryFilters",
  () => ({
    __esModule: true,
    DiscoveryFilters: () => <div data-testid="discovery-filters" />,
  }),
);
jest.mock(
  "~/components/views/DiscoveryView/components/DiscoverySidebar",
  () => ({
    __esModule: true,
    DiscoverySidebar: () => <div data-testid="discovery-sidebar" />,
  }),
);
jest.mock(
  "~/components/views/DiscoveryView/components/MapPreviewSidebar",
  () => ({
    __esModule: true,
    MapPreviewSidebar: () => <div data-testid="map-preview-sidebar" />,
  }),
);
jest.mock(
  "~/components/views/DiscoveryView/components/ModalFirstTimeUser",
  () => ({
    __esModule: true,
    ModalFirstTimeUser: () => <div data-testid="first-time-modal" />,
  }),
);
jest.mock(
  "~/components/views/DiscoveryView/components/NoResultsBanner",
  () => ({
    __esModule: true,
    NoSearchResultsBanner: () => <div data-testid="no-search-results" />,
  }),
);
jest.mock("~/components/views/DiscoveryView/components/ProjectHeader", () => ({
  __esModule: true,
  ProjectHeader: () => <div data-testid="project-header" />,
}));
jest.mock(
  "~/components/views/DiscoveryView/components/ProjectsView/ProjectsView",
  () => ({
    __esModule: true,
    ProjectsView: () => <div data-testid="projects-view" />,
  }),
);
jest.mock("~/components/views/DiscoveryView/components/SamplesView", () => ({
  __esModule: true,
  SamplesView: () => <div data-testid="samples-view" />,
}));
jest.mock(
  "~/components/views/DiscoveryView/components/VisualizationsView/VisualizationsView",
  () => ({
    __esModule: true,
    VisualizationsView: () => <div data-testid="visualizations-view" />,
  }),
);

// --- helpers ----------------------------------------------------------------
const asMock = (fn: $TSFixMe) => fn as jest.Mock;

const dataLayerViews = () =>
  jest.requireMock("~/components/views/DiscoveryView/DiscoveryDataLayer")
    .__views;

const baseProps = () => ({
  domain: "my_data",
  allowedFeatures: [] as string[],
  isAdmin: false,
  mapTilerKey: "map-tiler-key",
  updateDiscoveryProjectId: jest.fn(),
  cgWorkflowIds: [] as string[],
  cgRows: [],
  fetchTotalWorkflowCounts: jest.fn(async () => ({
    [WorkflowType.SHORT_READ_MNGS]: 5,
  })),
  fetchCgPage: jest.fn(async () => []),
  fetchNextGenWorkflowRuns: jest.fn(),
  fetchWorkflowRunsProjectAggregates: jest.fn(),
  history: { push: jest.fn() },
  location: { search: "" },
  match: { params: {} },
});

// Mounts DiscoveryView and hands back the live class instance so branch-heavy
// methods can be driven with exactly the state they branch on.
const mountView = async (overrides: $TSFixMe = {}) => {
  const props = { ...baseProps(), ...overrides };
  let instance: $TSFixMe = null;
  const utils = render(
    <DiscoveryView
      {...(props as $TSFixMe)}
      ref={(r: $TSFixMe) => {
        if (r) instance = r;
      }}
    />,
  );
  await waitFor(() => expect(instance).not.toBeNull());
  return { ...utils, props, instance };
};

// setState is async; this flushes it inside act().
const setStateAsync = (instance: $TSFixMe, patch: $TSFixMe) =>
  new Promise<void>(resolve => {
    instance.setState(patch, () => resolve());
  });

describe("DiscoveryView branch coverage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, "", "/my_data");
    jest.clearAllMocks();
    asMock(getDiscoveryDimensions).mockResolvedValue({
      projectDimensions: [],
      sampleDimensions: [],
    });
    asMock(getDiscoveryStats).mockResolvedValue({
      sampleStats: { count: 5, projectCount: 2, countByWorkflow: {} },
    });
    asMock(getDiscoveryVisualizations).mockResolvedValue({
      visualizations: [],
    });
    asMock(getDiscoveryLocations).mockResolvedValue({});
  });

  // --- getWorkflowToDisplay: the "default tab is empty" fallback chain -------
  describe("getWorkflowToDisplay", () => {
    const counts = (overrides: $TSFixMe) => ({
      [WorkflowType.SHORT_READ_MNGS]: 0,
      [WorkflowType.LONG_READ_MNGS]: 0,
      [WorkflowType.CONSENSUS_GENOME]: 0,
      [WorkflowType.AMR]: 0,
      ...overrides,
    });

    it("keeps the requested workflow when it has samples", async () => {
      const { instance } = await mountView();
      expect(
        instance.getWorkflowToDisplay(
          WorkflowType.AMR,
          counts({ [WorkflowType.AMR]: 3 }),
        ),
      ).toBe(WorkflowType.AMR);
    });

    it("falls back through long-read, then CG, then AMR", async () => {
      const { instance } = await mountView();
      // Requested tab empty, short-read empty -> long-read wins.
      expect(
        instance.getWorkflowToDisplay(
          WorkflowType.CONSENSUS_GENOME,
          counts({ [WorkflowType.LONG_READ_MNGS]: 2 }),
        ),
      ).toBe(WorkflowType.LONG_READ_MNGS);
      // Only CG has samples.
      expect(
        instance.getWorkflowToDisplay(
          WorkflowType.AMR,
          counts({ [WorkflowType.CONSENSUS_GENOME]: 4 }),
        ),
      ).toBe(WorkflowType.CONSENSUS_GENOME);
      // Only AMR has samples.
      expect(
        instance.getWorkflowToDisplay(
          WorkflowType.CONSENSUS_GENOME,
          counts({ [WorkflowType.AMR]: 1 }),
        ),
      ).toBe(WorkflowType.AMR);
      // Short-read is checked first even when several are non-empty.
      expect(
        instance.getWorkflowToDisplay(
          WorkflowType.AMR,
          counts({
            [WorkflowType.SHORT_READ_MNGS]: 1,
            [WorkflowType.LONG_READ_MNGS]: 9,
          }),
        ),
      ).toBe(WorkflowType.SHORT_READ_MNGS);
    });

    it("returns short-read-mngs when nothing has samples and when counts are missing", async () => {
      const { instance } = await mountView();
      expect(instance.getWorkflowToDisplay(WorkflowType.AMR, counts({}))).toBe(
        WorkflowType.SHORT_READ_MNGS,
      );
      // countByWorkflow undefined exercises the optional-chaining fallbacks.
      expect(instance.getWorkflowToDisplay(WorkflowType.AMR, undefined)).toBe(
        WorkflowType.SHORT_READ_MNGS,
      );
    });
  });

  // --- small pure helpers ---------------------------------------------------
  describe("getName", () => {
    it("renames locationV2 and tissue and capitalizes anything else", async () => {
      const { instance } = await mountView();
      expect(instance.getName("locationV2")).toBe("location");
      expect(instance.getName("tissue")).toBe("Sample Type");
      expect(instance.getName("host")).toBe("Host");
    });
  });

  describe("getSnapshotPrefix", () => {
    it("is empty without a snapshot id and /pub/<id> with one", async () => {
      const plain = await mountView();
      expect(plain.instance.getSnapshotPrefix()).toBe("");
      plain.unmount();

      const snap = await mountView({
        domain: "snapshot",
        snapshotShareId: "abc123",
      });
      expect(snap.instance.getSnapshotPrefix()).toBe("/pub/abc123");
    });
  });

  describe("getFilterCount", () => {
    it("counts array filters by length, scalars as one and empty values as zero", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        filters: {
          taxonSelected: [{ id: 1 }, { id: 2 }],
          hostSelected: [],
          timeSelected: "1_month",
          tissueSelected: null,
        },
      });
      // 2 (array) + 0 (empty array) + 1 (truthy scalar) + 0 (falsy scalar)
      expect(instance.getFilterCount()).toBe(3);
    });
  });

  describe("getCurrentDimensions", () => {
    it("maps the current tab onto the matching dimensions and is undefined elsewhere", async () => {
      const { instance } = await mountView();
      const projectDimensions = [{ dimension: "host", values: [] }];
      const sampleDimensions = [{ dimension: "tissue", values: [] }];
      await setStateAsync(instance, {
        projectDimensions,
        sampleDimensions,
        currentTab: TAB_PROJECTS,
      });
      expect(instance.getCurrentDimensions()).toBe(projectDimensions);

      await setStateAsync(instance, { currentTab: TAB_SAMPLES });
      expect(instance.getCurrentDimensions()).toBe(sampleDimensions);

      // The visualizations tab has no dimensions of its own.
      await setStateAsync(instance, { currentTab: TAB_VISUALIZATIONS });
      expect(instance.getCurrentDimensions()).toBeUndefined();
    });
  });

  describe("getClientSideSuggestions", () => {
    it("skips missing dimensions and dimensions whose values do not match", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        currentTab: TAB_SAMPLES,
        sampleDimensions: [
          {
            dimension: "host",
            values: [
              { value: "human", text: "Human" },
              { value: "mosquito", text: "Mosquito" },
            ],
          },
          // Present but nothing will match the query -> results.length === 0.
          { dimension: "tissue", values: [{ value: "csf", text: "CSF" }] },
          // locationV2 is absent entirely -> the `if (dimension)` false path.
        ],
      });

      const suggestions = await instance.getClientSideSuggestions("hum");
      expect(Object.keys(suggestions)).toEqual(["host"]);
      expect(suggestions.host.name).toBe("Host");
      expect(suggestions.host.results).toEqual([
        { category: "host", id: "human", title: "Human" },
      ]);
    });

    it("returns nothing when no dimension matches", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        currentTab: TAB_SAMPLES,
        sampleDimensions: [
          { dimension: "host", values: [{ value: "human", text: "Human" }] },
        ],
      });
      expect(await instance.getClientSideSuggestions("zzzz")).toEqual({});
    });
  });

  // --- workflow tabs --------------------------------------------------------
  describe("computeWorkflowTabs", () => {
    it("shows only short-read-mngs for snapshots", async () => {
      const { instance } = await mountView({
        domain: "snapshot",
        snapshotShareId: "abc123",
      });
      const tabs = instance.computeWorkflowTabs();
      expect(tabs.map((t: $TSFixMe) => t.value)).toEqual([
        WorkflowType.SHORT_READ_MNGS,
      ]);
    });

    it("omits the benchmark tab for a plain user and adds it for admins", async () => {
      const plain = await mountView();
      expect(
        plain.instance.computeWorkflowTabs().map((t: $TSFixMe) => t.value),
      ).not.toContain(WorkflowType.BENCHMARK);
      plain.unmount();

      const admin = await mountView({ isAdmin: true });
      expect(
        admin.instance.computeWorkflowTabs().map((t: $TSFixMe) => t.value),
      ).toContain(WorkflowType.BENCHMARK);
    });

    it("adds the benchmark tab for a non-admin holding the benchmarking feature flag", async () => {
      const { instance } = await mountView({
        allowedFeatures: ["benchmarking"],
      });
      expect(
        instance.computeWorkflowTabs().map((t: $TSFixMe) => t.value),
      ).toContain(WorkflowType.BENCHMARK);
    });
  });

  describe("getWorkflowTab", () => {
    const countOf = (tab: $TSFixMe) => tab.label.props.count.props.children;

    it("prefers the explicit count, then the filtered count, then zero", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        filteredSampleCountsByWorkflow: {
          [WorkflowType.SHORT_READ_MNGS]: 7,
          [WorkflowType.AMR]: undefined,
        },
      });
      // Explicit count wins over the filtered count.
      expect(
        countOf(instance.getWorkflowTab(WorkflowType.SHORT_READ_MNGS, 3)),
      ).toBe(3);
      // No explicit count -> filtered count.
      expect(
        countOf(instance.getWorkflowTab(WorkflowType.SHORT_READ_MNGS)),
      ).toBe(7);
      // Neither -> the "0" string fallback.
      expect(countOf(instance.getWorkflowTab(WorkflowType.AMR))).toBe("0");
    });

    it("renders a dash while the filtered count is null (reset in flight)", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        filteredSampleCountsByWorkflow: {
          [WorkflowType.CONSENSUS_GENOME]: null,
        },
      });
      expect(
        countOf(instance.getWorkflowTab(WorkflowType.CONSENSUS_GENOME)),
      ).toBe("-");
    });
  });

  describe("resetWorkflowDataOnTabChange", () => {
    it("resets the AMR collection, the benchmark collection, or neither", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();
      views.amrWorkflowRuns.reset.mockClear();
      views.benchmarkWorkflowRuns.reset.mockClear();

      instance.resetWorkflowDataOnTabChange(WorkflowType.AMR);
      expect(views.amrWorkflowRuns.reset).toHaveBeenCalledTimes(1);
      expect(views.benchmarkWorkflowRuns.reset).not.toHaveBeenCalled();

      instance.resetWorkflowDataOnTabChange(WorkflowType.BENCHMARK);
      expect(views.benchmarkWorkflowRuns.reset).toHaveBeenCalledTimes(1);

      // A workflow with no case in the switch falls through untouched.
      instance.resetWorkflowDataOnTabChange(WorkflowType.SHORT_READ_MNGS);
      expect(views.amrWorkflowRuns.reset).toHaveBeenCalledTimes(1);
      expect(views.benchmarkWorkflowRuns.reset).toHaveBeenCalledTimes(1);
    });
  });

  // --- no-search-results banner ---------------------------------------------
  describe("getNoSearchResultsBannerData", () => {
    it("describes each tab and wires the link to the other tab", async () => {
      const { instance } = await mountView();
      const projects = instance.getNoSearchResultsBannerData(TAB_PROJECTS);
      expect(projects.searchType).toBe("Project");
      expect(projects.listenerLink.text).toBe("Or view Sample results");

      const samples = instance.getNoSearchResultsBannerData(TAB_SAMPLES);
      expect(samples.searchType).toBe("Sample");
      expect(samples.listenerLink.text).toBe("Or view Project results");

      const viz = instance.getNoSearchResultsBannerData(TAB_VISUALIZATIONS);
      expect(viz.searchType).toBe("Visualization");
      expect(viz.listenerLink.text).toBe("Or view Sample results");
    });

    it("returns the empty shell for an unknown tab", async () => {
      const { instance } = await mountView();
      const banner = instance.getNoSearchResultsBannerData("not-a-tab");
      expect(banner.searchType).toBe("");
      expect(banner.icon).toBeNull();
      expect(banner.listenerLink.text).toBe("");
    });

    // NOTE: listenerLink.onClick calls handleTabChange with a tab *name*
    // (TAB_SAMPLES) while handleTabChange indexes computeTabs() by position, so
    // invoking it throws. That is a pre-existing app bug, already flagged in
    // DiscoveryView-DiscoveryView.test.tsx; we assert the wiring exists rather
    // than pretending the click works.
    it("hands the banner a clickable listener link", async () => {
      const { instance } = await mountView();
      const banner = instance.getNoSearchResultsBannerData(TAB_PROJECTS);
      expect(typeof banner.listenerLink.onClick).toBe("function");
      expect(banner.listenerLink).not.toHaveProperty("tabToSwitchTo");
    });
  });

  // --- search suggestion selection ------------------------------------------
  describe("handleSearchSelected", () => {
    it("adds a taxon filter and clears the search box", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, { filters: {}, search: "mala" });
      instance.handleSearchSelected(
        {
          key: "taxon",
          value: "5",
          sdsTaxonFilterData: { id: 5, level: "species", name: "Plasmodium" },
        },
        {} as $TSFixMe,
      );
      await waitFor(() =>
        expect(instance.state.filters.taxonSelected).toEqual([
          { id: 5, level: "species", name: "Plasmodium" },
        ]),
      );
      expect(instance.state.search).toBeNull();
    });

    it("routes a sample suggestion to the sample view instead of filtering", async () => {
      const { instance, props } = await mountView();
      await setStateAsync(instance, { filters: {}, search: null });
      instance.handleSearchSelected(
        { key: "sample", value: "77", sdsTaxonFilterData: undefined },
        {} as $TSFixMe,
      );
      expect(props.history.push).toHaveBeenCalledTimes(1);
      expect(String(props.history.push.mock.calls[0][0])).toContain("77");
      // No filter was added, and with search already null nothing is reset.
      expect(instance.state.filters).toEqual({});
    });

    it("routes a project suggestion to the project, synthesizing a stub project", async () => {
      const { instance, props } = await mountView();
      await setStateAsync(instance, { filters: {}, search: null });
      instance.handleSearchSelected(
        { key: "project", value: "42", sdsTaxonFilterData: undefined },
        {} as $TSFixMe,
      );
      await waitFor(() =>
        expect(props.updateDiscoveryProjectId).toHaveBeenCalledWith("42"),
      );
      expect(instance.state.projectId).toBe("42");
      expect(instance.state.currentTab).toBe(TAB_SAMPLES);
    });

    it("accepts a dimension suggestion only when it is a known value", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        currentTab: TAB_SAMPLES,
        sampleDimensions: [
          {
            dimension: "host",
            values: [{ value: "human", text: "Human", count: 1 }],
          },
        ],
        filters: {},
        search: null,
      });

      // Unknown value for a known dimension -> ignored entirely.
      instance.handleSearchSelected(
        { key: "host", value: "alien", sdsTaxonFilterData: undefined },
        {} as $TSFixMe,
      );
      expect(instance.state.filters.hostSelected).toBeUndefined();

      // Known value -> added.
      instance.handleSearchSelected(
        { key: "host", value: "human", sdsTaxonFilterData: undefined },
        {} as $TSFixMe,
      );
      await waitFor(() =>
        expect(instance.state.filters.hostSelected).toEqual(["human"]),
      );
    });
  });

  // --- metadata filter clicks from the sidebar ------------------------------
  describe("handleMetadataFilterClick", () => {
    it("seeds a new filter list, appends to an existing one and ignores duplicates", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, { filters: {} });

      // No existing key -> the else branch seeds a single-element list.
      instance.handleMetadataFilterClick("host", "human" as $TSFixMe);
      await waitFor(() =>
        expect(instance.state.filters.hostSelected).toEqual(["human"]),
      );

      // Existing key, new value -> appended.
      instance.handleMetadataFilterClick("host", "mosquito" as $TSFixMe);
      await waitFor(() =>
        expect(instance.state.filters.hostSelected).toEqual([
          "human",
          "mosquito",
        ]),
      );

      // Existing key, value already present -> early return, no change.
      instance.handleMetadataFilterClick("host", "human" as $TSFixMe);
      expect(instance.state.filters.hostSelected).toEqual([
        "human",
        "mosquito",
      ]);
    });
  });

  // --- free-text search -----------------------------------------------------
  describe("handleStringSearch", () => {
    it("trims a search, normalizes blank input to null and no-ops when unchanged", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, { search: null });

      instance.handleStringSearch("  malaria  ");
      await waitFor(() => expect(instance.state.search).toBe("malaria"));

      // Whitespace-only collapses to null via the `|| null` fallback.
      instance.handleStringSearch("   ");
      await waitFor(() => expect(instance.state.search).toBeNull());

      // Empty string is falsy, so `search && search.trim()` short-circuits;
      // the value is already null so the `!==` guard blocks the setState.
      const before = instance.state;
      instance.handleStringSearch("");
      expect(instance.state).toBe(before);
    });
  });

  // --- object (sample) selection --------------------------------------------
  describe("handleObjectSelected", () => {
    it("navigates via the router for a plain click and opens a tab for cmd/ctrl click", async () => {
      const { instance, props } = await mountView();
      await setStateAsync(instance, {
        workflow: WorkflowType.SHORT_READ_MNGS,
        filters: {},
      });

      instance.handleObjectSelected({
        object: { id: "12" },
        currentEvent: undefined as $TSFixMe,
      });
      expect(props.history.push).toHaveBeenCalledTimes(1);
      expect(openUrl).not.toHaveBeenCalled();

      instance.handleObjectSelected({
        object: { id: "12" },
        currentEvent: { metaKey: true } as $TSFixMe,
      });
      expect(openUrl).toHaveBeenCalledTimes(1);
      expect(props.history.push).toHaveBeenCalledTimes(1);

      instance.handleObjectSelected({
        object: { id: "12" },
        currentEvent: { metaKey: false, ctrlKey: true } as $TSFixMe,
      });
      expect(openUrl).toHaveBeenCalledTimes(2);

      // Neither modifier held -> back to the router.
      instance.handleObjectSelected({
        object: { id: "12" },
        currentEvent: { metaKey: false, ctrlKey: false } as $TSFixMe,
      });
      expect(props.history.push).toHaveBeenCalledTimes(2);
    });

    it("reads the id off sample.id for workflow-run entities and persists sticky filters", async () => {
      const { instance, props } = await mountView();
      await setStateAsync(instance, {
        workflow: WorkflowType.CONSENSUS_GENOME,
        workflowEntity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
        filters: { taxonSelected: [{ id: 9, level: "species", name: "Zika" }] },
      });

      instance.handleObjectSelected({
        object: { id: "run-3", sample: { id: "55" } } as $TSFixMe,
        currentEvent: undefined as $TSFixMe,
      });

      const url = String(props.history.push.mock.calls[0][0]);
      // The sample id (not the workflow-run id) becomes the path segment, and
      // the run id is carried as a query param.
      expect(url).toContain("/samples/55");
      expect(url).toContain("workflowRunId=run-3");
      // A non-empty taxonSelected takes the persisted-filter branch.
      expect(url).toContain("tempSelectedOptions");
    });

    it("omits temp options when no sticky filters are set", async () => {
      const { instance, props } = await mountView();
      await setStateAsync(instance, {
        workflow: WorkflowType.SHORT_READ_MNGS,
        workflowEntity: WORKFLOW_ENTITIES.SAMPLES,
        filters: {
          annotationsSelected: [],
          taxonSelected: [],
          taxonThresholdsSelected: [],
        },
      });

      instance.handleObjectSelected({
        object: { id: "12" },
        currentEvent: undefined as $TSFixMe,
      });
      const url = String(props.history.push.mock.calls[0][0]);
      expect(url).toContain("/samples/12");
      expect(url).not.toContain("tempSelectedOptions");
    });
  });

  // --- data refresh helpers -------------------------------------------------
  describe("refreshProjectData", () => {
    it("falls back to a stub project when the collection has no entry", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();
      await setStateAsync(instance, { projectId: "88" });

      views.projects.get.mockReturnValueOnce(undefined);
      instance.refreshProjectData();
      await waitFor(() =>
        expect(instance.state.project).toEqual({
          id: "88",
          name: "",
          editable: false,
        }),
      );

      const real = { id: "88", name: "Real Project", editable: true };
      views.projects.get.mockReturnValueOnce(real);
      instance.refreshProjectData();
      await waitFor(() => expect(instance.state.project).toBe(real));
    });
  });

  describe("refreshSampleData", () => {
    it("updates selectable ids only for the workflow currently on screen", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        workflow: WorkflowType.SHORT_READ_MNGS,
        selectableSampleIds: ["old"],
        filteredSampleCountsByWorkflow: {},
      });
      const views = dataLayerViews();
      views.samples.ids = ["a", "b", "c"];

      // Refreshing the on-screen workflow also refreshes selectable ids.
      instance.refreshSampleData(WorkflowType.SHORT_READ_MNGS);
      await waitFor(() =>
        expect(
          instance.state.filteredSampleCountsByWorkflow[
            WorkflowType.SHORT_READ_MNGS
          ],
        ).toBe(3),
      );
      expect(instance.state.selectableSampleIds).toEqual(["a", "b", "c"]);

      // Refreshing a different workflow leaves selectable ids alone.
      views.longReadMngsSamples.ids = ["x"];
      instance.refreshSampleData(WorkflowType.LONG_READ_MNGS);
      await waitFor(() =>
        expect(
          instance.state.filteredSampleCountsByWorkflow[
            WorkflowType.LONG_READ_MNGS
          ],
        ).toBe(1),
      );
      expect(instance.state.selectableSampleIds).toEqual(["a", "b", "c"]);
    });

    it("treats a missing selectable-id list as a count of zero", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();
      views.samples.getIds.mockReturnValueOnce(undefined);
      instance.refreshSampleData(WorkflowType.SHORT_READ_MNGS);
      await waitFor(() =>
        expect(
          instance.state.filteredSampleCountsByWorkflow[
            WorkflowType.SHORT_READ_MNGS
          ],
        ).toBe(0),
      );
    });
  });

  describe("refreshWorkflowRunData", () => {
    it("counts selectable ids and falls back to zero when there are none", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();

      views.amrWorkflowRuns.ids = ["r1", "r2"];
      instance.refreshWorkflowRunData(WorkflowType.AMR);
      await waitFor(() =>
        expect(
          instance.state.filteredSampleCountsByWorkflow[WorkflowType.AMR],
        ).toBe(2),
      );

      views.amrWorkflowRuns.getIds.mockReturnValueOnce(undefined);
      instance.refreshWorkflowRunData(WorkflowType.AMR);
      await waitFor(() =>
        expect(
          instance.state.filteredSampleCountsByWorkflow[WorkflowType.AMR],
        ).toBe(0),
      );
    });
  });

  describe("handleNewWorkflowRunsCreated", () => {
    it("adds to the existing counts and treats an unknown workflow as starting from zero", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        workflowCounts: { [WorkflowType.CONSENSUS_GENOME]: 4 },
        filteredSampleCountsByWorkflow: {
          [WorkflowType.CONSENSUS_GENOME]: 2,
          [WorkflowType.AMR]: 0,
        },
      });

      instance.handleNewWorkflowRunsCreated({
        numWorkflowRunsCreated: 3,
        workflow: WorkflowType.CONSENSUS_GENOME,
      });
      await waitFor(() =>
        expect(
          instance.state.workflowCounts[WorkflowType.CONSENSUS_GENOME],
        ).toBe(7),
      );
      expect(
        instance.state.filteredSampleCountsByWorkflow[
          WorkflowType.CONSENSUS_GENOME
        ],
      ).toBe(5);

      // AMR has no entry in workflowCounts -> the `|| 0` fallback applies.
      instance.handleNewWorkflowRunsCreated({
        numWorkflowRunsCreated: 2,
        workflow: WorkflowType.AMR,
      });
      await waitFor(() =>
        expect(instance.state.workflowCounts[WorkflowType.AMR]).toBe(2),
      );
    });
  });

  // --- map preview ----------------------------------------------------------
  describe("clearMapPreview", () => {
    it("only clears when a location is previewed", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        mapPreviewedLocationId: null,
        mapSidebarProjectCount: 12,
      });
      instance.clearMapPreview();
      // Nothing previewed -> the guard blocks the reset.
      expect(instance.state.mapSidebarProjectCount).toBe(12);

      await setStateAsync(instance, { mapPreviewedLocationId: 5 });
      instance.clearMapPreview();
      await waitFor(() =>
        expect(instance.state.mapPreviewedLocationId).toBeNull(),
      );
      expect(instance.state.mapSidebarProjectCount).toBeNull();
      expect(instance.state.mapSidebarSampleDimensions).toEqual([]);
    });
  });

  describe("refreshMapPreviewedSamples", () => {
    it("exits preview mode when the previewed location was filtered out", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        mapPreviewedLocationId: 9,
        mapLocationData: {},
        mapSidebarSampleCount: 3,
      });
      await instance.refreshMapPreviewedSamples();
      await waitFor(() =>
        expect(instance.state.mapPreviewedLocationId).toBeNull(),
      );
      expect(instance.state.mapSidebarSampleCount).toBeNull();
      expect(instance.mapPreviewSamples).toBe(instance.samples);
    });

    it("builds a location-scoped sample view when the location is still present", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        mapPreviewedLocationId: 9,
        mapLocationData: { 9: { id: 9, name: "Kenya" } },
      });
      await instance.refreshMapPreviewedSamples();
      expect(instance.mapPreviewSamples).not.toBe(instance.samples);
      expect(
        instance.mapPreviewSamples.opts.conditions.filters.locationV2,
      ).toEqual(["Kenya"]);
      expect(instance.mapPreviewSamples.loadPage).toHaveBeenCalledWith(0);
    });
  });

  describe("refreshMapPreviewedProjects", () => {
    it("exits preview mode when there is no previewed location", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        mapPreviewedLocationId: null,
        mapLocationData: {},
        mapSidebarProjectCount: 4,
      });
      await instance.refreshMapPreviewedProjects();
      await waitFor(() =>
        expect(instance.state.mapSidebarProjectCount).toBeNull(),
      );
      expect(instance.mapPreviewProjects).toBe(instance.projects);
    });

    it("builds a location-scoped project view otherwise", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        mapPreviewedLocationId: 3,
        mapLocationData: { 3: { id: 3, name: "Peru" } },
      });
      await instance.refreshMapPreviewedProjects();
      expect(
        instance.mapPreviewProjects.opts.conditions.filters.locationV2,
      ).toEqual(["Peru"]);
      expect(instance.mapPreviewProjects.loadPage).toHaveBeenCalledWith(0);
    });
  });

  describe("refreshMapPreviewedDimensions", () => {
    it("bails out without fetching when nothing is previewed", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        mapPreviewedLocationId: null,
        mapLocationData: {},
      });
      asMock(getDiscoveryStats).mockClear();
      await instance.refreshMapPreviewedDimensions();
      expect(getDiscoveryStats).not.toHaveBeenCalled();
    });

    it("fetches stats and dimensions scoped to the previewed location", async () => {
      const { instance } = await mountView();
      asMock(getDiscoveryStats).mockResolvedValue({
        sampleStats: { count: 2 },
      });
      asMock(getDiscoveryDimensions).mockResolvedValue({
        projectDimensions: [{ dimension: "host", values: [] }],
        sampleDimensions: [{ dimension: "tissue", values: [] }],
      });
      await setStateAsync(instance, {
        mapPreviewedLocationId: 7,
        mapLocationData: { 7: { id: 7, name: "Brazil" } },
      });
      asMock(getDiscoveryStats).mockClear();

      await instance.refreshMapPreviewedDimensions();
      expect(getDiscoveryStats).toHaveBeenCalledTimes(1);
      expect(
        asMock(getDiscoveryStats).mock.calls[0][0].filters.locationV2,
      ).toEqual(["Brazil"]);
      await waitFor(() =>
        expect(instance.state.mapSidebarSampleStats).toEqual({ count: 2 }),
      );
    });
  });

  describe("refreshPLQCPreviewedSamples", () => {
    it("scopes to the previewed sample ids when there are any", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, { plqcPreviewedSamples: ["1", "2"] });
      await instance.refreshPLQCPreviewedSamples();
      expect(instance.mapPreviewSamples.opts.conditions.sampleIds).toEqual([
        "1",
        "2",
      ]);
      await waitFor(() => expect(instance.state.mapSidebarSampleCount).toBe(2));
    });

    it("falls back to all samples when the previewed list is empty", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, { plqcPreviewedSamples: [] });
      await instance.refreshPLQCPreviewedSamples();
      expect(instance.mapPreviewSamples).toBe(instance.samples);
      await waitFor(() =>
        expect(instance.state.mapSidebarSampleCount).toBe(
          instance.samples.length,
        ),
      );
    });
  });

  // --- sort / tab plumbing --------------------------------------------------
  describe("resetDataFromSortChange", () => {
    it("dispatches to the collection matching the current tab", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();

      await setStateAsync(instance, { currentTab: TAB_PROJECTS });
      views.projects.reset.mockClear();
      instance.resetDataFromSortChange();
      expect(views.projects.reset).toHaveBeenCalledTimes(1);

      await setStateAsync(instance, { currentTab: TAB_VISUALIZATIONS });
      views.visualizations.reset.mockClear();
      instance.resetDataFromSortChange();
      expect(views.visualizations.reset).toHaveBeenCalledTimes(1);

      // Samples tab goes down the workflow-config path instead.
      await setStateAsync(instance, {
        currentTab: TAB_SAMPLES,
        workflow: WorkflowType.SHORT_READ_MNGS,
      });
      views.samples.reset.mockClear();
      views.projects.reset.mockClear();
      instance.resetDataFromSortChange();
      expect(views.samples.reset).toHaveBeenCalledTimes(1);
      expect(views.projects.reset).not.toHaveBeenCalled();
    });
  });

  describe("resetData", () => {
    it("can be called with no arguments (the callback is optional)", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();
      views.samples.reset.mockClear();
      expect(() => instance.resetData()).not.toThrow();
      expect(views.samples.reset).toHaveBeenCalledTimes(1);
    });

    it("invokes the callback when one is supplied", async () => {
      const { instance } = await mountView();
      const callback = jest.fn();
      instance.resetData({ callback });
      await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    });

    it("skips the next-gen fetch and the benchmark reset on the snapshot domain", async () => {
      const { instance, props } = await mountView({
        domain: "snapshot",
        snapshotShareId: "abc123",
      });
      asMock(props.fetchNextGenWorkflowRuns).mockClear();
      instance.resetData();
      expect(props.fetchNextGenWorkflowRuns).not.toHaveBeenCalled();
    });

    it("resets the benchmark collection when the benchmarking feature is on", async () => {
      const { instance } = await mountView({
        allowedFeatures: ["benchmarking"],
      });
      const views = dataLayerViews();
      views.benchmarkWorkflowRuns.reset.mockClear();
      instance.resetData();
      expect(views.benchmarkWorkflowRuns.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleProjectSelected", () => {
    it("keeps the summary map-sidebar tab but switches any other tab to samples", async () => {
      const first = await mountView();
      await setStateAsync(first.instance, { mapSidebarTab: "summary" });
      first.instance.handleProjectSelected({
        project: { id: "1" } as $TSFixMe,
      });
      await waitFor(() =>
        expect(first.instance.state.mapSidebarTab).toBe("summary"),
      );
      first.unmount();

      const second = await mountView();
      await setStateAsync(second.instance, { mapSidebarTab: TAB_PROJECTS });
      second.instance.handleProjectSelected({
        project: { id: "2" } as $TSFixMe,
      });
      await waitFor(() =>
        expect(second.instance.state.mapSidebarTab).toBe(TAB_SAMPLES),
      );
    });
  });

  // --- resetData / initialLoad secondary guards ------------------------------
  describe("resetData secondary guards", () => {
    it("resets the map-preview collections only once they have diverged", async () => {
      const { instance } = await mountView();
      // While the preview collections are the main ones, the identity guards
      // skip them.
      expect(instance.mapPreviewSamples).toBe(instance.samples);
      instance.resetData();
      expect(instance.samples.reset).toHaveBeenCalled();

      // Diverge them, as entering map-preview mode does.
      const previewSamples = { reset: jest.fn() };
      const previewProjects = { reset: jest.fn() };
      instance.mapPreviewSamples = previewSamples;
      instance.mapPreviewProjects = previewProjects;
      instance.resetData();
      expect(previewSamples.reset).toHaveBeenCalledTimes(1);
      expect(previewProjects.reset).toHaveBeenCalledTimes(1);
    });

    it("resets the projects and visualizations table views when they exist", async () => {
      const { instance } = await mountView();
      const projectsView = { reset: jest.fn() };
      const visualizationsView = { reset: jest.fn() };
      instance.projectsView = projectsView;
      instance.visualizationsView = visualizationsView;

      instance.resetData();
      await waitFor(() => expect(projectsView.reset).toHaveBeenCalled());
      expect(visualizationsView.reset).toHaveBeenCalled();

      // The same guards live in the per-tab reset helpers.
      projectsView.reset.mockClear();
      instance.resetProjectsData();
      expect(projectsView.reset).toHaveBeenCalledTimes(1);

      visualizationsView.reset.mockClear();
      instance.resetVisualizationsData();
      expect(visualizationsView.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe("initialLoad", () => {
    it("announces a pending sample deletion and clears the flag", async () => {
      const { showNotification } = jest.requireMock(
        "~/components/views/SampleView/utils",
      );
      const { instance } = await mountView();
      asMock(showNotification).mockClear();
      await setStateAsync(instance, { sampleWasDeleted: "Sample A" });

      instance.initialLoad();
      expect(showNotification).toHaveBeenCalledWith("sampleDeleteSuccess", {
        sampleName: "Sample A",
      });
      await waitFor(() => expect(instance.state.sampleWasDeleted).toBeNull());
    });

    it("loads filtered dimensions when a project is selected but no filter is set", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        filters: {},
        project: { id: "5", name: "P", editable: false },
      });
      const spy = jest.spyOn(instance, "refreshFilteredDimensions");
      instance.initialLoad();
      // getFilterCount() is 0, so the `|| project` side of the guard is what
      // lets the call through.
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("refreshFilteredLocations", () => {
    it("tolerates the locations endpoint returning nothing", async () => {
      const { instance } = await mountView();
      asMock(getDiscoveryLocations).mockResolvedValueOnce(undefined);
      await instance.refreshFilteredLocations();
      await waitFor(() => expect(instance.state.mapLocationData).toEqual({}));
    });
  });

  // --- map level clustering -------------------------------------------------
  describe("handleMapLevelChange", () => {
    it("keeps bubbles at or above the map level and rolls descendants into ancestors", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        currentTab: TAB_SAMPLES,
        rawMapLocationData: {
          10: {
            id: 10,
            name: "Kenya",
            geo_level: "country",
            sample_ids: [],
            country_id: null,
            state_id: null,
          },
          20: {
            id: 20,
            name: "Nairobi",
            geo_level: "city",
            sample_ids: [1, 2],
            country_id: 10,
            state_id: null,
          },
        },
      });

      instance.handleMapLevelChange("country");
      await waitFor(() => expect(instance.state.mapLevel).toBe("country"));

      const clustered = Object.values(instance.state.mapLocationData);
      // The city is below the map level, so it is not given its own bubble...
      expect(clustered.length).toEqual(1);
      expect(clustered.find(entry => entry.id === 20)).toBeUndefined();
      // ...its samples roll up into the country bubble instead.
      expect(clustered[0]).toMatchObject({
        id: 10,
        name: "Kenya",
        geo_level: "country",
        country_id: null,
        state_id: null,
        sample_ids: [1, 2],
      });
    });

    it("drops ancestor bubbles that have no samples of their own", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        currentTab: TAB_PROJECTS,
        rawMapLocationData: {
          30: {
            id: 30,
            name: "Peru",
            geo_level: "country",
            project_ids: [],
            country_id: null,
            state_id: null,
          },
        },
      });

      instance.handleMapLevelChange("city");
      await waitFor(() => expect(instance.state.mapLevel).toBe("city"));
      // Country sits above the city map level and has no projects of its own,
      // so its now-empty bubble is removed.
      expect(Object.values(instance.state.mapLocationData).length).toEqual(0);
    });
  });

  // --- workflow tab switching ------------------------------------------------
  describe("handleWorkflowTabChange", () => {
    it("drops out of the PLQC display when the target workflow has no PLQC", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, {
        currentDisplay: "plqc",
        currentTab: TAB_SAMPLES,
      });

      const tabs = instance.computeWorkflowTabs();
      const cgIndex = tabs.findIndex(
        (t: $TSFixMe) => t.value === WorkflowType.CONSENSUS_GENOME,
      );
      instance.handleWorkflowTabChange(cgIndex);
      await waitFor(() =>
        expect(instance.state.workflow).toBe(WorkflowType.CONSENSUS_GENOME),
      );
      expect(instance.state.currentDisplay).toBe("table");
      // Consensus genome is a workflow-run entity, so selectable sample ids
      // are left untouched by the spread guard.
      expect(instance.state.workflowEntity).toBe(
        WORKFLOW_ENTITIES.WORKFLOW_RUNS,
      );
    });

    it("keeps the PLQC display and refreshes selectable ids for short-read mNGS", async () => {
      const { instance } = await mountView();
      const views = dataLayerViews();
      views.samples.ids = ["s1", "s2"];
      await setStateAsync(instance, {
        currentDisplay: "plqc",
        currentTab: TAB_SAMPLES,
        selectableSampleIds: [],
      });

      const tabs = instance.computeWorkflowTabs();
      const srIndex = tabs.findIndex(
        (t: $TSFixMe) => t.value === WorkflowType.SHORT_READ_MNGS,
      );
      instance.handleWorkflowTabChange(srIndex);
      await waitFor(() => expect(instance.state.currentDisplay).toBe("plqc"));
      // Sample-entity workflow, so the selectable ids are refreshed.
      expect(instance.state.selectableSampleIds).toEqual(["s1", "s2"]);
    });
  });

  describe("handleTabChange", () => {
    it("mirrors the new tab into the map sidebar unless it is pinned to summary", async () => {
      const { instance } = await mountView();
      await setStateAsync(instance, { mapSidebarTab: TAB_PROJECTS });
      const tabs = instance.computeTabs();
      const samplesIndex = tabs.findIndex(
        (t: $TSFixMe) => t.value === TAB_SAMPLES,
      );

      instance.handleTabChange(String(samplesIndex));
      await waitFor(() =>
        expect(instance.state.mapSidebarTab).toBe(TAB_SAMPLES),
      );

      // Pinned to "summary" -> the sidebar tab is left alone.
      await setStateAsync(instance, { mapSidebarTab: "summary" });
      const projectsIndex = tabs.findIndex(
        (t: $TSFixMe) => t.value === TAB_PROJECTS,
      );
      instance.handleTabChange(String(projectsIndex));
      await waitFor(() => expect(instance.state.currentTab).toBe(TAB_PROJECTS));
      expect(instance.state.mapSidebarTab).toBe("summary");
    });
  });

  describe("map preview sidebar reset guard", () => {
    it("resets the sidebar only once one has been registered", async () => {
      const { instance } = await mountView();
      instance.mapPreviewSidebar = null;
      await setStateAsync(instance, { plqcPreviewedSamples: [] });
      // No sidebar registered -> the `&&` guard short-circuits, no throw.
      await expect(
        instance.refreshPLQCPreviewedSamples(),
      ).resolves.toBeUndefined();

      const sidebar = { reset: jest.fn() };
      instance.mapPreviewSidebar = sidebar;
      await instance.refreshPLQCPreviewedSamples();
      expect(sidebar.reset).toHaveBeenCalledTimes(1);

      sidebar.reset.mockClear();
      await instance.refreshMapPreviewedData();
      expect(sidebar.reset).toHaveBeenCalledTimes(1);
    });
  });

  // --- render: the map display and its sidebar ------------------------------
  describe("render in map display", () => {
    const mapProps = {
      allowedFeatures: ["sorting_v0_admin"],
    };

    it("renders the map-preview sidebar with unfiltered counts when nothing is previewed", async () => {
      const { instance, getByTestId } = await mountView(mapProps);
      await setStateAsync(instance, {
        userDataCounts: { sampleCountByWorkflow: {} },
        currentDisplay: "map",
        currentTab: TAB_SAMPLES,
        showStats: true,
        mapPreviewedLocationId: null,
        plqcPreviewedSamples: null,
        filteredProjectCount: 4,
        filteredSampleCountsByWorkflow: {
          [WorkflowType.SHORT_READ_MNGS]: 9,
        },
      });
      expect(getByTestId("map-preview-sidebar")).toBeTruthy();
    });

    it("renders the map-preview sidebar with previewed-location counts", async () => {
      const { instance, getByTestId } = await mountView(mapProps);
      await setStateAsync(instance, {
        userDataCounts: { sampleCountByWorkflow: {} },
        currentDisplay: "map",
        currentTab: TAB_PROJECTS,
        showStats: true,
        mapPreviewedLocationId: 7,
        plqcPreviewedSamples: ["1"],
        mapSidebarProjectCount: 2,
        mapSidebarSampleCount: 3,
        mapSidebarProjectDimensions: [],
        mapSidebarSampleDimensions: [],
        mapSidebarSampleStats: { count: 3 },
      });
      expect(getByTestId("map-preview-sidebar")).toBeTruthy();
    });

    it("hides the right pane entirely on the visualizations tab", async () => {
      const { instance, queryByTestId } = await mountView(mapProps);
      await setStateAsync(instance, {
        userDataCounts: { sampleCountByWorkflow: {} },
        currentTab: TAB_VISUALIZATIONS,
        showStats: true,
        currentDisplay: "map",
      });
      expect(queryByTestId("map-preview-sidebar")).toBeNull();
      expect(queryByTestId("discovery-sidebar")).toBeNull();
    });

    it("uses the discovery sidebar in table display and reports a snapshot project count", async () => {
      const { instance, getByTestId } = await mountView({
        domain: "snapshot",
        snapshotShareId: "abc123",
      });
      await setStateAsync(instance, {
        userDataCounts: { sampleCountByWorkflow: {} },
        currentDisplay: "table",
        currentTab: TAB_SAMPLES,
        showStats: true,
        filteredSampleCountsByWorkflow: {
          [WorkflowType.SHORT_READ_MNGS]: 2,
        },
      });
      expect(getByTestId("discovery-sidebar")).toBeTruthy();
    });
  });

  describe("handleProjectUpdated / handleProjectDescriptionSave", () => {
    it("pushes the project through the data layer and edits the description in place", async () => {
      const { instance } = await mountView();
      const project = { id: "3", name: "Updated", editable: true };
      instance.handleProjectUpdated({ project } as $TSFixMe);
      await waitFor(() => expect(instance.state.project).toBe(project));

      instance.handleProjectDescriptionSave("a new description");
      await waitFor(() =>
        expect(instance.state.project.description).toBe("a new description"),
      );
      // The rest of the project is preserved.
      expect(instance.state.project.name).toBe("Updated");
    });
  });
});
