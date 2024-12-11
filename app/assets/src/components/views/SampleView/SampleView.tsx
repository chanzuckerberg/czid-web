import deepEqual from "fast-deep-equal";
import {
  find,
  get,
  head,
  isEmpty,
  isNull,
  map,
  merge,
  pull,
  uniq,
} from "lodash/fp";
import React, {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useLazyLoadQuery, useRelayEnvironment } from "react-relay";
import { toast } from "react-toastify";
import { fetchQuery, graphql } from "relay-runtime";
import {
  getBackgrounds,
  getCoverageVizSummary,
  getSampleReportData,
  getSamples,
} from "~/api";
import { getAmrDeprecatedData } from "~/api/amr";
import {
  ANALYTICS_EVENT_NAMES,
  TrackEventType,
  useTrackEvent,
} from "~/api/analytics";
import {
  createPersistedBackground,
  getPersistedBackground,
  updatePersistedBackground,
} from "~/api/persisted_backgrounds";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { getCoverageVizParams } from "~/components/common/CoverageVizBottomSidebar/utils";
import csSampleMessage from "~/components/common/SampleMessage/sample_message.scss";
import NarrowContainer from "~/components/layout/NarrowContainer";
import { IconLoading } from "~/components/ui/icons";
import {
  computeMngsReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import { logError } from "~/components/utils/logUtil";
import {
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
} from "~/components/utils/pipeline_versions";
import { isNotNullish } from "~/components/utils/typeUtils";
import {
  getWorkflowTypeFromLabel,
  isMngsWorkflow,
  WorkflowType,
  WORKFLOW_TABS,
} from "~/components/utils/workflows";
import {
  ActionType,
  createAction,
  GlobalContext,
} from "~/globalContext/reducer";
import { usePrevious } from "~/helpers/customHooks/usePrevious";
import { getGeneraPathogenCounts } from "~/helpers/taxon";
import Project from "~/interface/project";
import { ReportMetadata } from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  AmrDeprectatedData,
  BlastData,
  ConsensusGenomeClick,
  CurrentTabSample,
  FilterSelections,
  Lineage,
  ModalsVisible,
  RawReportData,
  SampleReportViewMode,
  SampleViewProps,
} from "~/interface/sampleView";
import {
  AccessionData,
  Background,
  ConsensusGenomeData,
  PipelineRun,
  Taxon,
} from "~/interface/shared";
import { SampleMessage } from "../../common/SampleMessage";
import { initialAmrContext } from "./components/AmrView/amrContext/initialState";
import {
  AmrContext,
  amrContextReducer,
} from "./components/AmrView/amrContext/reducer";
import { DetailsSidebarSwitcher } from "./components/DetailsSidebarSwitcher";
import { ModalManager } from "./components/ModalManager";
import { BlastModalInfo } from "./components/ModalManager/components/BlastModals/constants";
import { ReportPanel } from "./components/ReportPanel";
import { SampleViewHeader } from "./components/SampleViewHeader";
import { TabSwitcher } from "./components/TabSwitcher";
import cs from "./sample_view.scss";
import {
  addSampleDeleteFlagToSessionStorage,
  adjustMetricPrecision,
  determineInitialTab,
  filterReportData,
  GENUS_LEVEL_INDEX,
  getConsensusGenomeData,
  getPiplineRunByVersionOrId,
  getStateFromUrlandLocalStorage,
  getWorkflowCount,
  hasAppliedFilters,
  initializeSelectedOptions,
  KEY_SAMPLE_VIEW_OPTIONS,
  KEY_SELECTED_OPTIONS_BACKGROUND,
  loadState,
  NOTIFICATION_TYPES,
  PIPELINE_RUN_TABS,
  provideOptionToRevertToSampleViewFilters,
  selectedOptionsReducer,
  setDisplayName,
  shouldEnableMassNormalizedBackgrounds,
  showNotification,
  SPECIES_LEVEL_INDEX,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  urlParser,
  URL_FIELDS,
} from "./utils";
import { SampleViewSampleQuery } from "./__generated__/SampleViewSampleQuery.graphql";

//  Notes from Suzette on converting SampleView to hooks - Aug 2023
//  1.  First we need to get any persisted options from local storage and the URL
//  2.  The component uses those options to set the initial state
//  3.  The component needs to fetch data from the API based on those options
//       a. Before the component started by fetching the background data but that shows that this component was initially designed to only work with the short read pipeline as that is the only one that relys on background data
//       b. The component needs to fetch the sample and figure out which is the current pipeline/workflow run
//       c. Using the sample id, filter options, and backgrounds we can fetch the short read report data
//       d. The consensus genome report data is fetched using the workflow run id
//       e. The AMR report data is fetched in the AMRView component (we should work towards this pattern for all the report data)
//  4.  Whenever selectedOptions or other fields stored in the url change, the component needs to update the URL.
//  5.  If the user manually changes selectedOptions (e.g. by clicking on a filter) then the component needs to update the local storage

const SampleQuery = graphql`
  query SampleViewSampleQuery($railsSampleId: String, $snapshotLinkId: String) {
    SampleForReport(
      railsSampleId: $railsSampleId
      snapshotLinkId: $snapshotLinkId
    ) {
      id
      created_at
      default_background_id
      default_pipeline_run_id
      editable
      host_genome_id
      initial_workflow
      name
      pipeline_runs {
        adjusted_remaining_reads
        alignment_config_name
        assembled
        created_at
        id
        pipeline_version
        run_finalized
        total_ercc_reads
        wdl_version
      }
      project {
        id
        name
        pinned_alignment_config
      }
      project_id
      railsSampleId
      status
      updated_at
      upload_error
      user_id
      workflow_runs {
        deprecated
        executed_at
        id
        input_error {
          label
          message
        }
        inputs {
          accession_id
          accession_name
          creation_source
          ref_fasta
          taxon_id
          taxon_name
          technology
          card_version
          wildcard_version
        }
        parsed_cached_results {
          quality_metrics {
            total_reads
            total_ercc_reads
            adjusted_remaining_reads
            percent_remaining
            qc_percent
            compression_ratio
            insert_size_mean
            insert_size_standard_deviation
          }
        }
        run_finalized
        status
        wdl_version
        workflow
      }
    }
  }
`;

const SampleViewComponent = ({
  snapshotShareId,
  sampleId,
}: SampleViewProps) => {
  const trackEvent = useRef<TrackEventType | null>(null);
  trackEvent.current = useTrackEvent();
  const environment = useRelayEnvironment();

  const {
    pipelineVersionFromUrl,
    viewFromUrl,
    selectedOptionsFromLocal,
    selectedOptionsFromUrl,
    tempSelectedOptions,
    workflowRunIdFromUrl,
    currentTabFromUrl,
  } = getStateFromUrlandLocalStorage(location, localStorage);
  const initialCurrentTab = useRef(currentTabFromUrl);

  const [pipelineVersion, setPipelineVersion] = useState<string>(
    pipelineVersionFromUrl,
  );
  const [currentTab, setCurrentTab] =
    useState<CurrentTabSample>(currentTabFromUrl);
  // initially set the selected options taking into account the url and local storage
  const [selectedOptions, dispatchSelectedOptions] = useReducer(
    selectedOptionsReducer,
    {
      tempSelectedOptions,
      currentTab,
      selectedOptionsFromLocal,
      selectedOptionsFromUrl,
    },
    initializeSelectedOptions,
  );
  const [view, setView] = useState<SampleReportViewMode>(
    viewFromUrl || ("table" as const),
  );
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(
    workflowRunIdFromUrl || null,
  );
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<Background[]>([]);
  const [otherBackgrounds, setOtherBackgrounds] = useState<Background[]>([]);
  const [hasPersistedBackground, setHasPersistedBackground] = useState<
    boolean | null
  >(null);
  const [isCreatingPersistedBackground, setIsCreatingPersistedBackground] =
    useState(false);
  const [sample, setSample] = useState<Readonly<Sample> | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectSamples, setProjectSamples] = useState<
    Pick<Sample, "id" | "name">[]
  >([]);
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [enableMassNormalizedBackgrounds, setEnableMassNormalizedBackgrounds] =
    useState(false);
  const [lineageData, setLineageData] = useState<{ [key: string]: Lineage }>(
    {},
  );
  const [loadingReport, setLoadingReport] = useState(false);
  const [filteredReportData, setFilteredReportData] = useState<Taxon[]>([]);
  const [reportData, setReportData] = useState<Taxon[]>([]);
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({});
  const [workflowRun, setWorkflowRun] = useState<WorkflowRun | null>(null);
  const [amrDeprecatedData, setAmrDeprecatedData] = useState<
    AmrDeprectatedData[] | null
  >(null);
  const [blastData, setBlastData] = useState<BlastData | Record<string, never>>(
    {},
  );
  const [blastModalInfo, setBlastModalInfo] = useState<BlastModalInfo>({});
  const [consensusGenomeData, setConsensusGenomeData] =
    useState<ConsensusGenomeData>({});
  const [consensusGenomePreviousParams, setConsensusGenomePreviousParams] =
    useState<ConsensusGenomeData | Record<string, never>>({});
  const [coverageVizDataByTaxon, setCoverageVizDataByTaxon] = useState<{
    [taxonId: number]: AccessionData;
  }>({});
  const [coverageVizParams, setCoverageVizParams] = useState<
    CoverageVizParamsRaw | Record<string, never>
  >({});
  const [coverageVizVisible, setCoverageVizVisible] = useState(false);
  const [modalsVisible, setModalsVisible] = useState<ModalsVisible>({
    consensusGenomeError: false,
    consensusGenomeCreation: false,
    consensusGenomePrevious: false,
    blastSelection: false,
    blastContigs: false,
    blastReads: false,
  });
  const [sidebarMode, setSidebarMode] = useState<
    "sampleDetails" | "taxonDetails"
  >("sampleDetails");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarTaxonData, setSidebarTaxonData] = useState<Taxon | null>(null);

  const [ignoreProjectBackground] = useState<boolean>(
    !!(
      (
        (selectedOptionsFromUrl && // if selected options exist from url
          isNull(selectedOptionsFromUrl.background)) || // and if background is null in url 1️⃣
        !isEmpty(tempSelectedOptions)
      ) // or if temp options exists 2️⃣ // Don't fetch saved background if have temp options (e.g. if coming from heatmap)
    ),
  );

  const [showIndexWarning, setShowIndexWarning] = useState<boolean>(false);

  const sampleData = useLazyLoadQuery<SampleViewSampleQuery>(SampleQuery, {
    railsSampleId: sampleId?.toString(),
    snapshotLinkId: snapshotShareId,
  });

  useEffect(() => {
    if (sampleData?.SampleForReport) {
      setSample(sampleData.SampleForReport as unknown as Sample);
    }
  }, [sampleData]);

  const prevPipelineVersion = usePrevious(pipelineVersion);
  const prevSelectedOptions = usePrevious(selectedOptions);
  const prevView = usePrevious(view);
  const prevCurrentTab = usePrevious(currentTab);
  const prevWorkflowRunId = usePrevious(workflowRunId);

  useEffect(() => {
    if (
      prevPipelineVersion !== pipelineVersion ||
      !deepEqual(prevSelectedOptions, selectedOptions) ||
      prevView !== view ||
      prevCurrentTab !== currentTab ||
      prevWorkflowRunId !== workflowRunId
    ) {
      const urlFieldsMap: URL_FIELDS = {
        pipelineVersion: pipelineVersion,
        selectedOptions: selectedOptions,
        view: view,
        currentTab: currentTab,
        workflowRunId: workflowRunId,
      };
      let urlQuery = urlParser.stringify(urlFieldsMap);
      if (urlQuery) {
        urlQuery = `?${urlQuery}`;
      }
      history.replaceState(urlFieldsMap, `SampleView`, `${urlQuery}`);
    }
  }, [
    pipelineVersion,
    prevPipelineVersion,
    selectedOptions,
    prevSelectedOptions,
    view,
    prevView,
    currentTab,
    prevCurrentTab,
    prevWorkflowRunId,
    workflowRunId,
  ]);

  const revertToSampleViewFilters = () => {
    const { selectedOptions: selectedOptionsFromLocal } = loadState(
      localStorage,
      KEY_SAMPLE_VIEW_OPTIONS,
    );
    dispatchSelectedOptions({
      type: "revertToSampleViewFilters",
      payload: {
        selectedOptionsFromLocal,
      },
    });
  };

  useEffect(() => {
    // selectedOptionsFromURL overrides selectedOptionsFromLocal in initializeSelectedOptions
    // but selectedOptionsFromLocal can be reverted back to using this function
    provideOptionToRevertToSampleViewFilters(
      tempSelectedOptions,
      currentTabFromUrl,
      revertToSampleViewFilters,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When we navigate to the SampleView via React Router, let Appcues know we are on this page.
    if (window.analytics) {
      window.analytics.page();
    }
    // When SampleView unmounts unsubscribe from the toast notifications
    return () => {
      toast.dismiss();
    };
  }, []);

  useEffect(() => {
    if (!sample) {
      return;
    }

    setProject(sample.project);

    const pipelineRun = getPiplineRunByVersionOrId(pipelineVersion, sample);
    const enableMassNormalizedBackgrounds =
      shouldEnableMassNormalizedBackgrounds(pipelineRun);
    setPipelineRun(pipelineRun);
    setEnableMassNormalizedBackgrounds(enableMassNormalizedBackgrounds);

    const newCurrentTab = determineInitialTab({
      initialWorkflow: sample.initial_workflow,
      workflowCount: getWorkflowCount(sample),
      currentTab: initialCurrentTab.current,
    });

    setCurrentTab(newCurrentTab);
  }, [snapshotShareId, sampleId, pipelineVersion, sample]);

  useEffect(() => {
    // track Clicks on tabs
    if (typeof currentTab === "string") {
      const name = currentTab.replace(/\W+/g, "-").toLowerCase();
      trackEvent.current &&
        trackEvent.current(`SampleView_tab-${name}_clicked`, {
          tab: currentTab,
        });
    }
  }, [currentTab]);

  useEffect(() => {
    if (showIndexWarning && currentTab === WORKFLOW_TABS.SHORT_READ_MNGS) {
      showNotification(NOTIFICATION_TYPES.multipleIndexVersions, {
        indexName: pipelineRun?.alignment_config_name,
      });
      setShowIndexWarning(false);
    }
  }, [showIndexWarning, currentTab, pipelineRun]);

  useEffect(() => {
    if (
      currentTab === WORKFLOW_TABS.CONSENSUS_GENOME ||
      currentTab === WORKFLOW_TABS.AMR
    ) {
      const newWorkflowRun =
        find(
          { workflow: getWorkflowTypeFromLabel(currentTab) },
          sample?.workflow_runs,
        ) || null;
      setWorkflowRun(newWorkflowRun);
      setWorkflowRunId(newWorkflowRun?.id || null);
    }
  }, [currentTab, sample?.workflow_runs]);

  useEffect(() => {
    const fetchAmrDeprecatedData = async () => {
      const amrDeprecatedData: AmrDeprectatedData[] =
        await getAmrDeprecatedData(sampleId);
      setAmrDeprecatedData(amrDeprecatedData);
    };
    if (!amrDeprecatedData) {
      fetchAmrDeprecatedData();
    }
  }, [sampleId, amrDeprecatedData]);

  useEffect(() => {
    // define function to fetch all background data
    const fetchBackgrounds = async (snapshotShareId?: string) => {
      setLoadingReport(true);
      const {
        owned_backgrounds: ownedBackgrounds,
        other_backgrounds: otherBackgrounds,
      } = await getBackgrounds({
        snapshotShareId,
        categorizeBackgrounds: !snapshotShareId,
      });
      const backgrounds = [...ownedBackgrounds, ...otherBackgrounds];
      setOwnedBackgrounds(ownedBackgrounds);
      setOtherBackgrounds(otherBackgrounds);
      setBackgrounds(backgrounds);
      return backgrounds;
    };

    // call function to fetch all background data
    fetchBackgrounds(snapshotShareId).catch(error => {
      console.error(error);
    });
  }, [snapshotShareId]);

  useEffect(() => {
    const fetchPersistedBackground = async ({
      projectId,
    }: {
      projectId: number;
    }) => {
      await getPersistedBackground(projectId)
        .then(({ background_id: persistedBackgroundFetched }) => {
          dispatchSelectedOptions({
            type: "newBackground",
            payload: {
              background: persistedBackgroundFetched,
            },
          });
          setHasPersistedBackground(true);
        })
        .catch((error: { error: string }) => {
          // the user has not created a persisted background for this sample yet
          setHasPersistedBackground(false);
          // if some other error has occured, log it
          if (error.error !== "Persisted background not found") {
            console.error(error);
          }
        });
    };
    if (
      project?.id &&
      !ignoreProjectBackground &&
      hasPersistedBackground === null
    ) {
      fetchPersistedBackground({ projectId: project && parseInt(project.id) });
    }
  }, [project, project?.id, ignoreProjectBackground, hasPersistedBackground]);

  const processRawSampleReportData = useCallback(
    (rawReportData: RawReportData) => {
      const reportData: Taxon[] = [];
      const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
      if (rawReportData.sortedGenus) {
        const generaPathogenCounts = getGeneraPathogenCounts(
          rawReportData.counts[SPECIES_LEVEL_INDEX],
        );

        rawReportData.sortedGenus.forEach((genusTaxId: number) => {
          let hasHighlightedChildren = false;
          const childrenSpecies =
            rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].species_tax_ids;
          const speciesData = childrenSpecies?.map((speciesTaxId: number) => {
            const isHighlighted = highlightedTaxIds.has(speciesTaxId);
            hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
            const speciesInfo =
              rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId];
            const speciesWithAdjustedMetricPrecision =
              adjustMetricPrecision(speciesInfo);
            return merge(speciesWithAdjustedMetricPrecision, {
              highlighted: isHighlighted,
              taxId: speciesTaxId,
              taxLevel: TAX_LEVEL_SPECIES,
            });
          });
          reportData.push(
            merge(rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId], {
              highlightedChildren: hasHighlightedChildren,
              pathogens: generaPathogenCounts[genusTaxId],
              taxId: genusTaxId,
              taxLevel: TAX_LEVEL_GENUS,
              species: speciesData,
            }),
          );
        });
      }
      setDisplayName({ reportData, nameType: selectedOptions?.nameType });
      // filter report data based on selected options
      dispatchSelectedOptions({
        type: "filterReportData",
        payload: {
          currentTab,
          setFilteredReportData,
          reportData,
        },
      });
      setLineageData(rawReportData.lineage);
      setReportData(reportData);
      setReportMetadata(rawReportData.metadata);
      setLoadingReport(false);
      dispatchSelectedOptions({
        type: "newBackground",
        payload: {
          background: rawReportData.metadata.backgroundId,
        },
      });
    },
    [currentTab, selectedOptions?.nameType],
  );
  const fetchSampleReportData = useCallback(
    async ({ backgroundId }: { backgroundId?: number | null } = {}) => {
      let selectedBackground =
        backgrounds.find(
          background => selectedOptions.background === background.id,
        ) || null;
      if (
        (!ignoreProjectBackground && isEmpty(selectedBackground)) ||
        (!enableMassNormalizedBackgrounds &&
          get("mass_normalized", selectedBackground))
      ) {
        // When the selectedBackground is incompatible with the sample, set it to "None"
        // and show a popup about why it is not compatible.
        selectedBackground &&
          showNotification(NOTIFICATION_TYPES.invalidBackground, {
            backgroundName: selectedBackground.name,
          });
        selectedBackground = null;
      }

      const backgroundAlignmentConfigs =
        selectedBackground?.alignment_config_names ?? [];
      // remove pipeline run's alignment config from the list of
      // alignment configs for the background
      const nonMatchingAlignmentConfigs = pull(
        pipelineRun?.alignment_config_name,
        backgroundAlignmentConfigs,
      );

      if (nonMatchingAlignmentConfigs.length > 0) {
        setShowIndexWarning(true);
      }

      const backgroundIdUsed = backgroundId || selectedBackground?.id || null;

      setLoadingReport(true);
      trackEvent.current &&
        trackEvent.current(
          ANALYTICS_EVENT_NAMES.PIPELINE_SAMPLE_REPORT_SAMPLE_VIEWED,
          {
            sampleId,
            workflow: currentTab,
          },
        );
      try {
        const rawReportData: RawReportData = await getSampleReportData({
          snapshotShareId,
          sampleId,
          background: backgroundIdUsed,
          pipelineVersion,
        });
        if (rawReportData) {
          processRawSampleReportData(rawReportData);
          dispatchSelectedOptions({
            type: "rawReportDataProcessed",
            payload: {
              allTaxIds: rawReportData?.all_tax_ids,
              backgroundIdUsed,
            },
          });
        }
        return !!rawReportData;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [
      backgrounds,
      ignoreProjectBackground,
      enableMassNormalizedBackgrounds,
      sampleId,
      currentTab,
      selectedOptions?.background,
      snapshotShareId,
      pipelineVersion,
      pipelineRun,
      processRawSampleReportData,
    ],
  );

  const persistNewBackgroundModelSelection = useCallback(
    async ({ newBackgroundId }: { newBackgroundId: number | null }) => {
      if (project?.id) {
        let persistBackgroundApi = updatePersistedBackground;
        if (
          hasPersistedBackground === false &&
          !isCreatingPersistedBackground
        ) {
          setIsCreatingPersistedBackground(true);
          persistBackgroundApi = createPersistedBackground;
        }

        await persistBackgroundApi({
          projectId: parseInt(project.id),
          backgroundId: newBackgroundId,
        })
          .then(() => {
            setIsCreatingPersistedBackground(false);
            setHasPersistedBackground(true);
          })
          .catch((error: Error) => {
            logError({
              message:
                "SampleView: Failed to persist background model selection",
              details: {
                error,
                projectId: project?.id,
                backgroundId: newBackgroundId,
                hasExistingPersistedBackground: hasPersistedBackground,
                isCreatingPersistedBackground,
              },
            });
            setIsCreatingPersistedBackground(false);
            console.error(error);
          });
      }
    },
    [hasPersistedBackground, project?.id, isCreatingPersistedBackground],
  );

  const handleInvalidBackgroundSelection = useCallback(
    ({ invalidBackgroundId }: { invalidBackgroundId: number | null }) => {
      const invalidBackground = backgrounds.find(
        background => invalidBackgroundId === background.id,
      );
      dispatchSelectedOptions({
        type: "optionChanged",
        payload: { key: KEY_SELECTED_OPTIONS_BACKGROUND, value: null },
      });
      showNotification(NOTIFICATION_TYPES.invalidBackground, {
        backgroundName: invalidBackground?.name,
      });
    },
    [backgrounds],
  );

  const previousBackground = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (!sample?.pipeline_runs || sample?.pipeline_runs?.length === 0) {
      // don't fetch sample report data if there is no mngs run on the sample
      // this will be fixed when we split the sample report by tab
      return;
    }
    if (!ignoreProjectBackground && hasPersistedBackground === null) {
      return;
    }
    if (
      selectedOptions?.background !== previousBackground.current ||
      prevPipelineVersion !== pipelineVersion
    ) {
      fetchSampleReportData({
        backgroundId: selectedOptions?.background,
      })
        .then(successfullyFetchedSampleReportData => {
          // if project background is different than background
          previousBackground.current = selectedOptions?.background || null;
          if (successfullyFetchedSampleReportData) {
            if (!ignoreProjectBackground && hasPersistedBackground !== null) {
              // ie if you have already checked if there is a persisted background via fetchPersistedBackground
              // and the background model is not currently being persisted
              persistNewBackgroundModelSelection({
                newBackgroundId: selectedOptions?.background,
              });
            }
          } else {
            handleInvalidBackgroundSelection({
              invalidBackgroundId: selectedOptions?.background,
            });
          }
        })
        .catch(err => console.error(err));
    }
  }, [
    selectedOptions?.background,
    ignoreProjectBackground,
    fetchSampleReportData,
    hasPersistedBackground,
    persistNewBackgroundModelSelection,
    sample?.pipeline_runs,
    handleInvalidBackgroundSelection,
    previousBackground,
    prevPipelineVersion,
    pipelineVersion,
  ]);

  const globalContext = useContext(GlobalContext);
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2531
  const dispatch = globalContext.globalContextDispatch;

  const updateDiscoveryProjectId = useCallback(
    (projectId: number | null) => {
      dispatch(
        createAction(ActionType.UPDATE_DISCOVERY_PROJECT_IDS, projectId),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    project?.id && updateDiscoveryProjectId(project && parseInt(project.id));
  }, [project, project?.id, updateDiscoveryProjectId]);

  useEffect(() => {
    const fetchProjectSamples = async (
      projectId: number,
      snapshotShareId?: string,
    ) => {
      // only really need sample names and ids, so request the basic version without extra details
      const projectSamples: {
        samples: Pick<Sample, "id" | "name">[];
      } = await getSamples({
        projectId: projectId,
        snapshotShareId: snapshotShareId,
        basic: true,
      });
      setProjectSamples(projectSamples.samples);
    };
    project?.id &&
      fetchProjectSamples(parseInt(project.id), snapshotShareId).catch(
        error => {
          console.error("Error fetching project samples", error);
        },
      );
  }, [project?.id, snapshotShareId]);

  useEffect(() => {
    setFilteredReportData(
      filterReportData({
        currentTab,
        reportData,
        filters: {
          annotations: selectedOptions.annotations,
          flags: selectedOptions.flags,
          taxa: selectedOptions.taxa,
          categories: selectedOptions.categories,
          thresholdsShortReads: selectedOptions.thresholdsShortReads,
          thresholdsLongReads: selectedOptions.thresholdsLongReads,
          readSpecificity: selectedOptions.readSpecificity,
        },
      }),
    );
  }, [
    selectedOptions?.annotations,
    selectedOptions?.flags,
    selectedOptions?.taxa,
    selectedOptions?.categories,
    selectedOptions?.thresholdsShortReads,
    selectedOptions?.thresholdsLongReads,
    selectedOptions?.readSpecificity,
    currentTab,
    reportData,
  ]);

  const shouldShowCoverageViz =
    (pipelineRun?.pipeline_version &&
      isPipelineFeatureAvailable(
        COVERAGE_VIZ_FEATURE,
        pipelineRun?.pipeline_version,
      )) ||
    currentTab === WORKFLOW_TABS.LONG_READ_MNGS;

  useEffect(() => {
    const fetchCoverageVizData = async () => {
      if (shouldShowCoverageViz) {
        const coverageVizSummary = await getCoverageVizSummary({
          sampleId: sampleId,
          snapshotShareId,
          pipelineVersion,
        });
        setCoverageVizDataByTaxon(coverageVizSummary);
      }
    };
    fetchCoverageVizData().catch(error => {
      console.error("Error fetching coverage viz data", error);
    });
  }, [pipelineVersion, sampleId, snapshotShareId, shouldShowCoverageViz]);

  const handlePipelineVersionSelect = (newPipelineVersion: string) => {
    if (newPipelineVersion === pipelineVersion) {
      return;
    }

    if (
      currentTab === WORKFLOW_TABS.SHORT_READ_MNGS ||
      currentTab === WORKFLOW_TABS.LONG_READ_MNGS
    ) {
      const newRun = find(
        { pipeline_version: newPipelineVersion },
        sample?.pipeline_runs,
      );
      if (!newRun) {
        console.error("No run found for the selected pipeline version");
        return;
      }
      setPipelineRun(newRun);
      setPipelineVersion(newPipelineVersion);
      setFilteredReportData([]);
      setReportData([]);
    } else if (
      currentTab === WORKFLOW_TABS.CONSENSUS_GENOME ||
      currentTab === WORKFLOW_TABS.AMR
    ) {
      const workflowVal: WorkflowType = getWorkflowTypeFromLabel(currentTab);
      const newRun = find(
        { wdl_version: newPipelineVersion, workflow: workflowVal },
        sample?.workflow_runs,
      );
      if (!newRun) {
        console.error("No run found for the selected pipeline version");
        return;
      }
      setWorkflowRun(newRun);
      setWorkflowRunId(newRun.id);
    }
  };

  const handleDeleteCurrentRun = (sample: Sample) => {
    const workflowCount = getWorkflowCount(sample);
    const workflow = getWorkflowTypeFromLabel(currentTab);

    let status: string;
    if (isMngsWorkflow(workflow)) {
      status = reportMetadata.pipelineRunStatus ?? "upload_failed";
    } else {
      status = workflowRun?.status ?? "no workflow run status";
    }

    trackEvent.current &&
      trackEvent.current(ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_SINGLE_RUN_DELETED, {
        workflow: workflow,
        runStatus: status.toLowerCase(),
        projectId: project?.id,
      });

    // add all the values of the workflowCount object
    const totalWorkflowCount = Object.values(workflowCount).reduce(
      (a, b) => a + b,
      0,
    );
    if (totalWorkflowCount <= 1) {
      // if there is only one or zero workflow run(s), navigate to the project page
      // zero workflow runs happens for failed short read mNGS uploads
      addSampleDeleteFlagToSessionStorage(sample?.name);
      location.replace(`/home?project_id=${sample.project_id}`);
      return;
    }

    // choose pipeline runs or workflow runs based on current tab
    const runType = isMngsWorkflow(workflow)
      ? "pipeline_runs"
      : "workflow_runs";

    const runs: readonly (
      | { id: number | string | null | undefined }
      | null
      | undefined
    )[] = sample[runType] || [];

    // filter out the current run
    const currentRun = getCurrentRun();

    const newRuns =
      (currentRun && runs.filter(run => run?.id !== currentRun.id)) || [];

    // update the workflowCount object
    const count = workflowCount[workflow];
    if (count) {
      workflowCount[workflow] = count - 1;
    }

    const nextTab = determineInitialTab({
      initialWorkflow: sample.initial_workflow,
      workflowCount,
      currentTab,
    });

    // update the state to remove the current run and change the tab
    setSample({
      ...sample,
      [runType]: newRuns,
    });
    setCurrentTab(nextTab);
  };

  const handleCoverageVizClick = (
    newCoverageVizParams: CoverageVizParamsRaw,
  ) => {
    if (!newCoverageVizParams.taxId) {
      setCoverageVizVisible(false);
      return;
    }

    if (
      coverageVizVisible &&
      get("taxId", coverageVizParams) === newCoverageVizParams.taxId
    ) {
      setCoverageVizVisible(false);
    } else {
      setCoverageVizParams(newCoverageVizParams);
      setCoverageVizVisible(true);
      setSidebarVisible(false);
    }
  };

  useEffect(() => {
    setDisplayName({ reportData, nameType: selectedOptions?.nameType });
    setReportData([...reportData]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions?.nameType]);

  const handleTaxonClick = (clickedTaxonData: Taxon) => {
    if (!clickedTaxonData.taxId) {
      setSidebarVisible(false);
      return;
    }

    if (
      sidebarMode === "taxonDetails" &&
      sidebarVisible &&
      sidebarTaxonData &&
      sidebarTaxonData.taxId === clickedTaxonData.taxId
    ) {
      setSidebarVisible(false);
    } else {
      setSidebarTaxonData(clickedTaxonData);
      setSidebarMode("taxonDetails");
      setSidebarVisible(true);
      setCoverageVizVisible(false);
    }
  };

  const toggleSampleDetailsSidebar = () => {
    if (sidebarVisible && sidebarMode === "sampleDetails") {
      setSidebarVisible(false);
    } else {
      setSidebarMode("sampleDetails");
      setSidebarVisible(true);
    }
  };

  const handleConsensusGenomeKickoff = async (sample: Sample) => {
    // Close both modals in case they came via the previous runs modal + error modal
    handleModalAction([
      ["close", "consensusGenomeCreation"],
      ["close", "consensusGenomePrevious"],
      ["close", "consensusGenomeError"],
    ]);
    fetchQuery<SampleViewSampleQuery>(environment, SampleQuery, {
      railsSampleId: sampleId?.toString(),
      snapshotLinkId: snapshotShareId,
    }).subscribe({
      next: response => {
        const updatedSample = response.SampleForReport as unknown as Sample;
        if (!updatedSample || !updatedSample.workflow_runs) {
          console.error("Error fetching updated sample", response);
          return;
        }
        setSample({
          ...sample,
          workflow_runs: updatedSample.workflow_runs.filter(isNotNullish),
        });
        showNotification(NOTIFICATION_TYPES.consensusGenomeCreated, {
          handleTabChange: () => setCurrentTab(WORKFLOW_TABS.CONSENSUS_GENOME),
        });
      },
      error: error => {
        console.error("Error fetching updated sample", error);
      },
    });
  };

  const handleConsensusGenomeClick = (
    params: ConsensusGenomeClick,
    sample: Sample,
  ) => {
    const { percentIdentity, taxId, taxName } = params;
    const accessionData = get(taxId, coverageVizDataByTaxon);
    const usedAccessions = uniq(
      map("inputs.accession_id", get(taxId, getConsensusGenomeData(sample))),
    );
    handleModalAction([["open", "consensusGenomeCreation"]]);

    setConsensusGenomeData({
      accessionData,
      percentIdentity,
      taxId,
      taxName,
      usedAccessions,
    });
  };

  // Clicking the HoverAction to open the previous CG modal
  const handlePreviousConsensusGenomeClick = (
    params: ConsensusGenomeClick,
    sample: Sample,
  ) => {
    const { percentIdentity, taxId, taxName } = params;
    const previousRuns = get(taxId, getConsensusGenomeData(sample));
    handleModalAction([["open", "consensusGenomePrevious"]]);
    setConsensusGenomePreviousParams({
      percentIdentity,
      previousRuns,
      taxId,
      taxName,
    });
  };

  // Opening up a previous Consensus Genome run
  const handlePreviousConsensusGenomeReportClick = ({
    rowData,
  }: {
    rowData: WorkflowRun;
  }) => {
    handleModalAction([["close", "consensusGenomePrevious"]]);
    setWorkflowRun(rowData);
    setWorkflowRunId(rowData.id);
    setCurrentTab(WORKFLOW_TABS.CONSENSUS_GENOME);
  };

  const handleBlastClick = (blastData: BlastData) => {
    handleModalAction([["open", "blastSelection"]]);
    setBlastData(blastData);
  };

  const handleBlastSelectionModalContinue = (
    blastModalInfo: BlastModalInfo,
  ) => {
    const { shouldBlastContigs } = blastModalInfo;
    const modalToOpen = shouldBlastContigs ? "blastContigs" : "blastReads";
    handleModalAction([
      ["close", "blastSelection"],
      ["open", modalToOpen],
    ]);
    setBlastModalInfo(blastModalInfo);
  };

  const handleModalAction = (
    modals: ["close" | "open", keyof ModalsVisible][],
  ) => {
    const newModalsVisible = { ...modalsVisible };
    modals.forEach(modal => {
      newModalsVisible[modal[1]] = modal[0] === "open";
    });
    setModalsVisible(newModalsVisible);
  };

  const handleMetadataUpdate = (key: string, value: string, sample: Sample) => {
    if (key === "name") {
      setSample({
        ...sample,
        name: value,
      });
    }
  };

  const clearAllFilters = () => {
    const newSelectedOptions: FilterSelections = { ...selectedOptions };
    newSelectedOptions.categories = {};
    newSelectedOptions.taxa = [];
    // Only clear thresholds filters that apply to the current tab
    if (currentTab === WORKFLOW_TABS.SHORT_READ_MNGS) {
      newSelectedOptions.thresholdsShortReads = [];
    } else if (currentTab === WORKFLOW_TABS.LONG_READ_MNGS) {
      newSelectedOptions.thresholdsLongReads = [];
    }
    newSelectedOptions.annotations = [];
    dispatchSelectedOptions({ type: "clear", payload: newSelectedOptions });
    setFilteredReportData(
      filterReportData({
        currentTab,
        reportData,
        filters: newSelectedOptions,
      }),
    );
  };

  const getCurrentRun = () => {
    // if the current tab is a pipeline run tab, return the pipeline run
    if (PIPELINE_RUN_TABS.includes(currentTab) && pipelineRun) {
      return pipelineRun;
    }
    // otherwise it will be a workflow run tab
    if (sample && sample?.workflow_runs && sample?.workflow_runs?.length > 0) {
      // if the workflow_runs and a workflowRunId is set, return that specific workflow run
      if (workflowRunId) {
        return find({ id: workflowRunId }, sample.workflow_runs);
      }
      // if the workflowRun is set and is the same as the currentTab workflow run return it
      const workflowType = getWorkflowTypeFromLabel(currentTab);
      if (workflowRun && workflowRun.workflow === workflowType) {
        return workflowRun;
      }
      // if there is a pipeline version, use that to choose which workflow run to return
      if (pipelineVersion) {
        return sample?.workflow_runs?.find(run => {
          if (run && run.workflow === workflowType && !!run.wdl_version) {
            return run.wdl_version === pipelineVersion;
          } else {
            return false;
          }
        });
      } else {
        // otherwise return the first workflow run of the currentTab workflow type
        return head(
          sample?.workflow_runs?.filter(run => run?.workflow === workflowType),
        );
      }
    }
    // if there is no pipeline run or workflow run,
    return null;
  };

  const handleViewClick = ({ view }: { view: SampleReportViewMode }) => {
    trackEvent.current &&
      trackEvent.current(`PipelineSampleReport_${view}-view-menu_clicked`);
    setView(view);
  };

  const getDownloadReportTableWithAppliedFiltersLink = () => {
    const [csvHeaders, csvRows] = computeMngsReportTableValuesForCSV(
      filteredReportData,
      selectedOptions,
      backgrounds,
      currentTab,
    );

    return createCSVObjectURL(csvHeaders, csvRows);
  };

  const handleChangeWorkflowRun = (workflowRun: WorkflowRun) => {
    setWorkflowRun(workflowRun);
    setWorkflowRunId(workflowRun.id);
  };

  const currentRun = getCurrentRun();
  const background =
    backgrounds.find(
      background => selectedOptions?.background === background.id,
    ) || null;

  const [amrContextState, amrContextDispatch] = useReducer(
    amrContextReducer,
    initialAmrContext,
  );

  return (
    <>
      <NarrowContainer className={cs.sampleViewContainer}>
        <AmrContext.Provider value={{ amrContextState, amrContextDispatch }}>
          <SampleViewHeader
            backgroundId={
              isNaN(Number(selectedOptions?.background))
                ? null
                : selectedOptions?.background
            }
            currentRun={currentRun}
            currentTab={currentTab}
            getDownloadReportTableWithAppliedFiltersLink={
              getDownloadReportTableWithAppliedFiltersLink
            }
            hasAppliedFilters={hasAppliedFilters(currentTab, selectedOptions)}
            onDetailsClick={toggleSampleDetailsSidebar}
            onPipelineVersionChange={handlePipelineVersionSelect}
            project={project}
            projectSamples={projectSamples}
            reportMetadata={reportMetadata}
            sample={sample}
            snapshotShareId={snapshotShareId}
            view={view}
            onDeleteRunSuccess={handleDeleteCurrentRun}
          />
          <TabSwitcher
            currentTab={currentTab}
            handleTabChange={setCurrentTab}
            reportMetadata={reportMetadata}
            sample={sample}
          />
          <ReportPanel
            amrDeprecatedData={amrDeprecatedData}
            backgrounds={backgrounds}
            currentTab={currentTab}
            currentRun={currentRun}
            clearAllFilters={clearAllFilters}
            dispatchSelectedOptions={dispatchSelectedOptions}
            enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
            filteredReportData={filteredReportData}
            handleAnnotationUpdate={fetchSampleReportData}
            handleBlastClick={handleBlastClick}
            handleConsensusGenomeClick={handleConsensusGenomeClick}
            handleCoverageVizClick={handleCoverageVizClick}
            handlePreviousConsensusGenomeClick={
              handlePreviousConsensusGenomeClick
            }
            handleTaxonClick={handleTaxonClick}
            handleViewClick={handleViewClick}
            handleWorkflowRunSelect={handleChangeWorkflowRun}
            lineageData={lineageData}
            loadingReport={loadingReport}
            ownedBackgrounds={ownedBackgrounds}
            otherBackgrounds={otherBackgrounds}
            project={project}
            reportData={reportData}
            reportMetadata={reportMetadata}
            sample={sample}
            selectedOptions={selectedOptions}
            snapshotShareId={snapshotShareId}
            view={view}
          />
        </AmrContext.Provider>
      </NarrowContainer>
      {shouldShowCoverageViz && pipelineRun?.pipeline_version && sample && (
        <CoverageVizBottomSidebar
          nameType={selectedOptions?.nameType}
          onBlastClick={handleBlastClick}
          onClose={() => setCoverageVizVisible(false)}
          params={getCoverageVizParams(
            coverageVizParams,
            coverageVizDataByTaxon,
          )}
          pipelineVersion={pipelineRun.pipeline_version}
          wdlVersion={pipelineRun.wdl_version}
          sampleId={sample.id}
          snapshotShareId={snapshotShareId}
          visible={coverageVizVisible}
          workflow={sample.initial_workflow}
        />
      )}
      {sample && currentRun && (
        <>
          <DetailsSidebarSwitcher
            handleMetadataUpdate={(key, value) =>
              handleMetadataUpdate(key, value, sample)
            }
            handleWorkflowRunSelect={handleChangeWorkflowRun}
            handleTabChange={setCurrentTab}
            currentRun={currentRun}
            closeSidebar={() => setSidebarVisible(false)}
            currentTab={currentTab}
            snapshotShareId={snapshotShareId}
            sidebarVisible={sidebarVisible}
            sidebarMode={sidebarMode}
            sample={sample}
            background={background}
            sidebarTaxonData={sidebarTaxonData}
          />
          <ModalManager
            blastData={blastData}
            blastModalInfo={blastModalInfo}
            consensusGenomeData={consensusGenomeData}
            consensusGenomePreviousParams={consensusGenomePreviousParams}
            handleBlastSelectionModalContinue={
              handleBlastSelectionModalContinue
            }
            handleConsensusGenomeClick={params =>
              handleConsensusGenomeClick(params, sample)
            }
            handleConsensusGenomeKickoff={handleConsensusGenomeKickoff}
            handleModalAction={handleModalAction}
            handlePreviousConsensusGenomeReportClick={
              handlePreviousConsensusGenomeReportClick
            }
            modalsVisible={modalsVisible}
            sample={sample}
          />
        </>
      )}
    </>
  );
};

interface SampleViewWrapperProps {
  sampleId: number;
  snapshotShareId?: string;
}

export const SampleView = ({
  sampleId,
  snapshotShareId,
}: SampleViewWrapperProps) => {
  return (
    <Suspense
      fallback={
        <SampleMessage
          icon={<IconLoading className={csSampleMessage.icon} />}
          message={"Loading report data."}
          status={"Loading"}
          type={"inProgress"}
        />
      }
    >
      <SampleViewComponent
        sampleId={sampleId}
        snapshotShareId={snapshotShareId}
      />
    </Suspense>
  );
};
