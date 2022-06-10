import { cx } from "@emotion/css";
import { reverse } from "lodash";
import {
  clone,
  debounce,
  find,
  get,
  isEmpty,
  isUndefined,
  map,
} from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import Moment from "react-moment";
import { Link as RouterLink } from "react-router-dom";
import { defaultTableRowRenderer } from "react-virtualized";

import {
  createPhyloTree,
  getNewPhyloTreePipelineRunIds,
  getNewPhyloTreePipelineRunInfo,
  getPhyloTrees,
  getProjectsToChooseFrom,
  validatePhyloTreeName,
} from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { chooseTaxon } from "~/api/phylo_tree_ngs";
import ProjectSelect from "~/components/common/ProjectSelect";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PHYLO_TREE_LINK } from "~/components/utils/documentationLinks";
import { showPhyloTreeNotification } from "~/components/views/phylo_tree/PhyloTreeNotification";
import InfiniteTable from "~/components/visualizations/table/InfiniteTable";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import Link from "~ui/controls/Link";
import { SubtextDropdown } from "~ui/controls/dropdowns";
import { IconLoading } from "~ui/icons";
import Notification from "~ui/notifications/Notification";
import Modal from "../../ui/containers/Modal";
import Wizard from "../../ui/containers/Wizard";
import Input from "../../ui/controls/Input";
import DataTable from "../../visualizations/table/DataTable";
import { COLUMNS } from "./ColumnConfiguration";
import PhyloTreeChecks from "./PhyloTreeChecks";

import cs from "./phylo_tree_creation_modal.scss";

class PhyloTreeCreationModal extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      defaultPage: 0,
      skipListTrees: false,
      phyloTreesLoaded: false,
      phyloTrees: [],

      projectPipelineRunsLoaded: false,
      projectPipelineRunIds: new Set(),
      // We only allow users to select runs with at least one contig,
      // even though we display all runs in their selected project.
      selectableProjectPipelineRuns: new Set(),
      selectedProjectPipelineRuns: new Set(),
      projectPipelineRunsSelectAllChecked: false,
      // We need to know the coverage breadth of runs to determine
      // whether or not to display the low coverage warning.
      projectCoverageBreadths: null,

      otherPipelineRunsLoaded: false,
      otherPipelineRunIds: new Set(),
      selectedOtherPipelineRuns: new Set(),
      otherPipelineRunsSelectAllChecked: false,
      // We need to know the coverage breadth of runs to determine
      // whether or not to display the low coverage warning.
      otherCoverageBreadths: null,
      otherSamplesFilter: "",

      taxonList: [],

      projectsLoaded: false,
      projectList: [],

      taxonId: this.props.taxonId,
      taxonName: this.props.taxonName,
      projectId: this.props.projectId,
      projectName: this.props.projectName,
      showErrorTaxonAndProject: false,
      showErrorName: false,
      showErrorSamples: false,
      showLowCoverageWarning: false,
      treeName: "",
      taxonQuery: null,
    };

    this.phyloTreeHeaders = {
      name: "Phylogenetic Tree",
      user: "Creator",
      last_update: "Last Updated",
      view: "View",
    };

    this.skipSelectProjectAndTaxon = this.props.projectId && this.props.taxonId;

    this.inputTimeout = null;
    this.inputDelay = 200;

    this.isTreeNameValidDebounced = debounce(
      this.inputDelay,
      this.isTreeNameValid,
    );
    this.handleTaxonSearchActionDebounced = debounce(
      this.inputDelay,
      this.handleTaxonSearchAction,
    );

    this.wizard = React.createRef();
    this.infiniteTable = null;
  }

  componentDidMount() {
    this.loadPhylotrees();
  }

  loadPhylotrees = async () => {
    const { taxonId, projectId } = this.state;

    const { phyloTrees } = await getPhyloTrees({
      taxId: taxonId,
      projectId,
    });

    // Combine the old + new tree index results.
    const { phyloTrees: phyloTreeNgs, taxonNameNg } = await getPhyloTrees({
      taxId: taxonId,
      projectId,
      nextGeneration: true,
    });

    if (isEmpty(phyloTrees) && isEmpty(phyloTreeNgs)) {
      this.setState({
        skipListTrees: true,
        phyloTreesLoaded: true,
      });
    } else {
      this.setState({
        // NOTE: This shows NG first so it may seem out-of-order if user has a
        // mix of old and new trees. Could sort by updated_at.
        phyloTrees: this.parsePhyloTreeData(phyloTreeNgs).concat(
          this.parsePhyloTreeData(phyloTrees),
        ),
        phyloTreesLoaded: true,
        taxonName: taxonNameNg,
      });
    }
  };

  parsePhyloTreeData = phyloTreeData => {
    if (isEmpty(phyloTreeData)) {
      return [];
    }
    return phyloTreeData.map(row => ({
      name: row.name,
      user: (row.user || {}).name,
      last_update: <Moment fromNow date={row.updated_at} />,
      view: row.nextGeneration ? (
        <RouterLink
          onClick={() => {
            trackEvent(
              ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_NG_LINK_CLICKED,
              { treeId: row.id },
            );
          }}
          to={`/phylo_tree_ngs/${row.id}`}
        >
          View
        </RouterLink>
      ) : (
        <Link
          analyticsEventData={{ treeId: row.id }}
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_LINK_CLICKED
          }
          href={`/phylo_trees/index?treeId=${row.id}`}
        >
          View
        </Link>
      ),
    }));
  };

  loadPipelineRunIds = () => {
    this.loadProjectPipelineRunIds();
    this.loadAdditionalPipelineRunIds();
  };

  loadProjectPipelineRunIds = async () => {
    const {
      taxonId,
      projectId,
      treeName,
      projectPipelineRunsLoaded,
    } = this.state;

    // Don't refetch the runs if they've already been loaded.
    if (!projectPipelineRunsLoaded) {
      const {
        pipelineRunIds,
        coverageBreadths,
        runsWithContigs,
      } = await getNewPhyloTreePipelineRunIds({
        getAdditionalSamples: false,
        projectId,
        taxId: taxonId,
      });

      this.setState({
        projectPipelineRunIds: new Set(reverse(pipelineRunIds)),
        projectPipelineRunsLoaded: true,
        showErrorName: false,
        projectCoverageBreadths: coverageBreadths,
        selectableProjectPipelineRuns: new Set(runsWithContigs),
      });
    }

    if (this.wizard.current) {
      const continueEnabled = !isEmpty(treeName);
      this.wizard.current.handleContinueEnabled(continueEnabled);
    }
  };

  loadAdditionalPipelineRunIds = async () => {
    const {
      taxonId,
      projectId,
      treeName,
      otherSamplesFilter,
      otherPipelineRunsLoaded,
    } = this.state;

    // Don't refetch the runs if they've already been loaded.
    if (!otherPipelineRunsLoaded) {
      const {
        pipelineRunIds,
        coverageBreadths,
      } = await getNewPhyloTreePipelineRunIds({
        getAdditionalSamples: true,
        projectId,
        taxId: taxonId,
        filter: otherSamplesFilter,
      });

      this.setState({
        otherPipelineRunIds: new Set(reverse(pipelineRunIds)),
        otherPipelineRunsLoaded: true,
        showErrorName: false,
        otherCoverageBreadths: coverageBreadths,
      });
    }

    if (this.wizard.current) {
      const continueEnabled = !isEmpty(treeName);
      this.wizard.current.handleContinueEnabled(continueEnabled);
    }
  };

  rowRenderer = rowProps => {
    const data = rowProps.rowData;

    if (data) {
      const numContigs = get("num_contigs", data);

      // If the run has no contigs, we disable the row and render a tooltip when its hovered.
      if (numContigs === 0) {
        rowProps.className = cx(rowProps.className, cs.disabled);
        return (
          <ColumnHeaderTooltip
            trigger={defaultTableRowRenderer(rowProps)}
            content={
              "There must be at least 1 contig in the sample for it to be selected for inclusion in the tree."
            }
            position="top center"
            style={{}} // Need to pass in a style to suppress a warning
            key={rowProps.key}
          />
        );
      }
    }
    return defaultTableRowRenderer(rowProps);
  };

  handleLoadProjectPipelineRunRows = async ({ startIndex, stopIndex }) => {
    const { taxonId, projectPipelineRunIds } = this.state;

    const idsToLoad = Array.from(projectPipelineRunIds).slice(
      startIndex,
      stopIndex + 1,
    );
    const { samples } = await getNewPhyloTreePipelineRunInfo({
      getAdditionalSamples: false,
      pipelineRunIds: idsToLoad,
      taxId: taxonId,
    });

    return samples;
  };

  handleLoadOtherPipelineRunRows = async ({ startIndex, stopIndex }) => {
    const { taxonId, otherPipelineRunIds } = this.state;

    const idsToLoad = Array.from(otherPipelineRunIds).slice(
      startIndex,
      stopIndex + 1,
    );
    const { samples } = await getNewPhyloTreePipelineRunInfo({
      getAdditionalSamples: true,
      pipelineRunIds: idsToLoad,
      taxId: taxonId,
    });

    return samples;
  };

  loadProjectSearchContext = () => {
    getProjectsToChooseFrom().then(projectList =>
      this.handleProjectSearchContextResponse(projectList),
    );

    if (this.wizard.current) {
      const continueEnabled = this.state.taxonId && this.state.projectId;
      this.wizard.current.handleContinueEnabled(continueEnabled);
    }
  };

  handleProjectSearchContextResponse = projectList =>
    this.setState({ projectList, projectsLoaded: true });

  handleSelectProject = result => {
    this.setState(
      {
        projectId: result.id,
        projectName: result.name,
        // Reset sample lists (in case user went back and changed project selection after they had been loaded)
        projectPipelineRunsLoaded: false,
        projectPipelineRunIds: new Set(),
        selectableProjectPipelineRuns: new Set(),
        selectedProjectPipelineRuns: new Set(),
        projectPipelineRunsSelectAllChecked: false,
        projectCoverageBreadths: null,

        otherPipelineRunsLoaded: false,
        otherPipelineRunIds: new Set(),
        selectedOtherPipelineRuns: new Set(),
        otherPipelineRunsSelectAllChecked: false,
        otherCoverageBreadths: null,
        otherSamplesFilter: "",
      },
      () =>
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_PROJECT_SELECTED,
          {
            projectId: result.id,
            projectName: result.name,
          },
        ),
    );

    if (this.wizard.current) {
      const taxonSelected = !isUndefined(this.state.taxonId);
      this.wizard.current.handleContinueEnabled(taxonSelected);
    }
  };

  handleSelectTaxon = taxonId => {
    const { taxonList } = this.state;
    const taxonName = find({ value: taxonId }, taxonList).title;

    this.setState(
      {
        taxonId,
        taxonName,
        // Reset sample lists (in case user went back and changed taxon selection after they had been loaded)
        projectPipelineRunsLoaded: false,
        projectPipelineRunIds: new Set(),
        selectableProjectPipelineRuns: new Set(),
        selectedProjectPipelineRuns: new Set(),
        projectPipelineRunsSelectAllChecked: false,
        projectCoverageBreadths: null,

        otherPipelineRunsLoaded: false,
        otherPipelineRunIds: new Set(),
        selectedOtherPipelineRuns: new Set(),
        otherPipelineRunsSelectAllChecked: false,
        otherCoverageBreadths: null,
        otherSamplesFilter: "",
      },
      () =>
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_TAXON_SELECTED,
          {
            taxonId,
            taxonName,
          },
        ),
    );

    if (this.wizard.current) {
      const projectSelected = !isUndefined(this.state.projectId);
      this.wizard.current.handleContinueEnabled(projectSelected);
    }
  };

  setPage = defaultPage => this.setState({ defaultPage });

  handleSelectProjectPipelineRunsRow = (value, checked) => {
    const {
      selectedProjectPipelineRuns: previousSelectedProjectPipelineRuns,
      selectableProjectPipelineRuns,
    } = this.state;

    let newSelectedProjectPipelineRuns = clone(
      previousSelectedProjectPipelineRuns,
    );

    if (checked) {
      newSelectedProjectPipelineRuns.add(value);
    } else {
      newSelectedProjectPipelineRuns.delete(value);
    }

    this.setState(
      {
        projectPipelineRunsSelectAllChecked:
          selectableProjectPipelineRuns.size ===
          newSelectedProjectPipelineRuns.size,
        selectedProjectPipelineRuns: newSelectedProjectPipelineRuns,
      },
      () => {
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_PROJECT_SAMPLES_CHANGED,
          {
            previousSelectedProjectPipelineRuns: Array.from(
              previousSelectedProjectPipelineRuns,
            ),
            newSelectedProjectPipelineRuns: Array.from(
              newSelectedProjectPipelineRuns,
            ),
          },
        );
      },
    );
  };

  handleSelectOtherPipelineRunsRow = (value, checked) => {
    const {
      selectedOtherPipelineRuns: previousSelectedOtherPipelineRuns,
      otherPipelineRunIds,
    } = this.state;

    let newSelectedOtherPipelineRuns = clone(previousSelectedOtherPipelineRuns);

    if (checked) {
      newSelectedOtherPipelineRuns.add(value);
    } else {
      newSelectedOtherPipelineRuns.delete(value);
    }

    this.setState(
      {
        otherPipelineRunsSelectAllChecked:
          otherPipelineRunIds.size === newSelectedOtherPipelineRuns.size,
        selectedOtherPipelineRuns: newSelectedOtherPipelineRuns,
      },
      () => {
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_OTHER_SAMPLES_CHANGED,
          {
            previousSelectedOtherPipelineRuns: Array.from(
              previousSelectedOtherPipelineRuns,
            ),
            newSelectedOtherPipelineRuns: Array.from(
              newSelectedOtherPipelineRuns,
            ),
          },
        );
      },
    );
  };

  handleSelectAllProjectPipelineRuns = checked => {
    const {
      selectedProjectPipelineRuns: previousSelectedProjectPipelineRuns,
      selectableProjectPipelineRuns,
    } = this.state;

    const newSelectedProjectPipelineRuns = checked
      ? clone(selectableProjectPipelineRuns)
      : new Set();

    this.setState(
      {
        projectPipelineRunsSelectAllChecked: checked,
        selectedProjectPipelineRuns: newSelectedProjectPipelineRuns,
      },
      () => {
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_PROJECT_SAMPLES_CHANGED,
          {
            previousSelectedProjectPipelineRuns: Array.from(
              previousSelectedProjectPipelineRuns,
            ),
            newSelectedProjectPipelineRuns: Array.from(
              newSelectedProjectPipelineRuns,
            ),
          },
        );
      },
    );
  };

  handleSelectAllOtherPipelineRuns = checked => {
    const {
      selectedOtherPipelineRuns: previousSelectedOtherPipelineRuns,
      otherPipelineRunIds,
    } = this.state;

    const newSelectedOtherPipelineRuns = checked
      ? clone(otherPipelineRunIds)
      : new Set();

    this.setState(
      {
        otherPipelineRunsSelectAllChecked: checked,
        selectedOtherPipelineRuns: newSelectedOtherPipelineRuns,
      },
      () => {
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_OTHER_SAMPLES_CHANGED,
          {
            previousSelectedOtherPipelineRuns: Array.from(
              previousSelectedOtherPipelineRuns,
            ),
            newSelectedOtherPipelineRuns: Array.from(
              newSelectedOtherPipelineRuns,
            ),
          },
        );
      },
    );
  };

  handleFilterChange = newFilter => {
    clearTimeout(this.inputTimeout);
    this.inputTimeout = setTimeout(() => {
      this.setState(
        {
          otherSamplesFilter: newFilter,
          otherPipelineRunIds: new Set(),
          otherPipelineRunsLoaded: false,
          otherCoverageBreadths: null,
        },
        () => {
          this.loadAdditionalPipelineRunIds();
          trackEvent(
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_SAMPLE_SEARCH_PERFORMED,
            {
              sampleSearchString: newFilter,
            },
          );
        },
      );
    }, this.inputDelay);
  };

  // We want to debounce isTreeNameValid because it does an API call, but not
  // handleNameChange because we want the search input to update immediately.
  handleNameChange = newName => {
    this.setState({ treeName: newName.trim() }, this.isTreeNameValidDebounced);
  };

  handleCreation = () => {
    const {
      treeName,
      projectId,
      selectedProjectPipelineRuns,
      selectedOtherPipelineRuns,
      taxonId,
    } = this.state;
    const { onClose } = this.props;

    const totalNumberOfSamplesSelected =
      selectedProjectPipelineRuns.size + selectedOtherPipelineRuns.size;
    const numberOfSamplesIsValid = PhyloTreeChecks.isNumberOfSamplesValid(
      totalNumberOfSamplesSelected,
    );

    if (!numberOfSamplesIsValid) {
      this.setState(
        {
          showErrorSamples: true,
        },
        () =>
          trackEvent(
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_INVALID_AMOUNT_OF_SAMPLES_SELECTED_FOR_CREATION,
            {
              totalNumberOfSamplesSelected,
              maxSamplesAllowed: PhyloTreeChecks.MAX_SAMPLES,
              minSamplesNeeded: PhyloTreeChecks.MIN_SAMPLES,
            },
          ),
      );
      return false;
    }

    const pipelineRunIds = Array.from(selectedProjectPipelineRuns).concat(
      Array.from(selectedOtherPipelineRuns),
    );

    createPhyloTree({
      treeName,
      projectId,
      taxId: taxonId,
      pipelineRunIds,
    }).then(({ phylo_tree_id: phyloTreeId }) => {
      const sharedAnalyticsPayload = {
        treeName,
        projectId,
        taxonId,
        pipelineRunIds,
      };
      if (phyloTreeId) {
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_NG_CREATION_SUCCESSFUL,
          {
            treeId: phyloTreeId,
            ...sharedAnalyticsPayload,
          },
        );

        showPhyloTreeNotification();
        onClose();
      } else {
        trackEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_NG_CREATION_FAILED,
          sharedAnalyticsPayload,
        );

        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error creating tree");
      }
    });

    return true;
  };

  handleComplete = () => {
    const { onClose } = this.props;

    if (this.handleCreation() && onClose) {
      onClose();
    }
  };

  handleTaxonInputChange = async value => {
    this.setState({ taxonQuery: value }, this.handleTaxonSearchActionDebounced);
  };

  handleTaxonSearchAction = async () => {
    const { taxonQuery, projectId } = this.state;

    if (isEmpty(taxonQuery)) {
      this.setState({
        taxonList: [],
        taxonId: null,
      });
      return;
    }

    const searchResults = await chooseTaxon({
      query: taxonQuery,
      projectId,
    });
    // SubtextDropdown needs text, value, subtext:
    const taxonList = map(t => {
      return { text: t.title, value: t.taxid, subtext: t.description, ...t };
    }, searchResults);

    this.setState({
      taxonList,
    });
  };

  isTreeNameValid = async () => {
    const { treeName } = this.state;
    const { sanitizedName, valid } = await validatePhyloTreeName({
      treeName,
    });

    this.setState({
      treeName: sanitizedName,
      treeNameValid: valid,
    });

    if (this.wizard.current) {
      const continueEnabled = !isEmpty(sanitizedName);
      this.wizard.current.handleContinueEnabled(continueEnabled);
    }

    return valid;
  };

  isNumberOfSamplesValid() {
    let nSamples =
      this.state.selectedProjectPipelineRuns.size +
      this.state.selectedOtherPipelineRuns.size;
    return PhyloTreeChecks.isNumberOfSamplesValid(nSamples);
  }

  canContinueWithTaxonAndProject = () => {
    if (this.state.taxonId && this.state.projectId) {
      this.setState({ showErrorTaxonAndProject: false }); // remove any pre-existing error message
      return true;
    }
    this.setState({ showErrorTaxonAndProject: true });
    return false;
  };

  canContinueWithTreeName = () => {
    const { treeName, treeNameValid } = this.state;

    this.setState({ showErrorName: true });
    const isTreeNameValid = this.isTreeNameValid();

    trackEvent(
      ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_TREE_NAME_ENTERED,
      {
        treeNameValid,
        treeName,
      },
    );

    return isTreeNameValid;
  };

  getTotalPageRendering() {
    let totalSelectedSamples =
      this.state.selectedProjectPipelineRuns.size +
      this.state.selectedOtherPipelineRuns.size;
    return `${totalSelectedSamples} Total Samples`;
  }

  renderNotifications() {
    const {
      treeName,
      treeNameValid,
      showErrorSamples,
      showErrorName,
      selectedProjectPipelineRuns,
      selectedOtherPipelineRuns,
      projectCoverageBreadths,
      otherCoverageBreadths,
    } = this.state;
    const { minCoverageBreadth } = this.props;

    let showLowCoverageWarning = false;
    for (const runId of selectedProjectPipelineRuns) {
      const coverageBreadth = projectCoverageBreadths[runId] * 100;
      if (coverageBreadth < minCoverageBreadth) {
        showLowCoverageWarning = true;
        break;
      }
    }
    if (!showLowCoverageWarning) {
      for (const runId of selectedOtherPipelineRuns) {
        const coverageBreadth = otherCoverageBreadths[runId] * 100;
        if (coverageBreadth < minCoverageBreadth) {
          showLowCoverageWarning = true;
          break;
        }
      }
    }

    if (showErrorName && !treeNameValid && treeName) {
      return (
        <Notification type="error" displayStyle="flat">
          The current tree name is taken. Please choose a different name.
        </Notification>
      );
    } else if (showErrorSamples && !this.isNumberOfSamplesValid()) {
      return (
        <Notification type="error" displayStyle="flat">
          Phylogenetic Tree creation must have between{" "}
          {PhyloTreeChecks.MIN_SAMPLES} and {PhyloTreeChecks.MAX_SAMPLES}{" "}
          samples.
        </Notification>
      );
    } else if (showLowCoverageWarning) {
      return (
        <Notification type="warning" displayStyle="flat">
          Some of the samples you have selected have low coverage breadth, under{" "}
          {minCoverageBreadth}%. This may reduce the quality of the output
          results.{" "}
          <ExternalLink
            coloredBackground={true}
            href={PHYLO_TREE_LINK}
            analyticsEventName={
              ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_LOW_COVERAGE_WARNING_BANNER_HELP_LINK_CLICKED
            }
          >
            Learn more
          </ExternalLink>
        </Notification>
      );
    }
    return null;
  }

  page = action => {
    const {
      projectList,
      projectId,

      projectPipelineRunsLoaded,
      projectPipelineRunIds,
      projectPipelineRunsSelectAllChecked,
      selectedProjectPipelineRuns,

      otherPipelineRunsLoaded,
      otherPipelineRunIds,
      otherPipelineRunsSelectAllChecked,
      selectedOtherPipelineRuns,
    } = this.state;

    let options = {
      listTrees: (
        <Wizard.Page
          key="page_1"
          className="wizard__page-1"
          skipDefaultButtons={true}
          title="Phylogenetic Trees"
          small
        >
          <div className="wizard__page-1__subtitle">{this.state.taxonName}</div>
          <div className="wizard__page-1__table">
            {this.state.phyloTreesLoaded && (
              <DataTable
                headers={this.phyloTreeHeaders}
                columns={["name", "user", "last_update", "view"]}
                data={this.state.phyloTrees}
              />
            )}
          </div>
          <div className="wizard__page-1__action">
            <Wizard.Action
              action="continue"
              onAfterAction={() =>
                trackEvent(
                  ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_CREATE_NEW_TREE_BUTTON_CLICKED,
                )
              }
            >
              + Create new tree
            </Wizard.Action>
          </div>
        </Wizard.Page>
      ),
      selectTaxonAndProject: (
        <Wizard.Page
          key="wizard__page_2"
          title="Select project and taxon"
          onLoad={this.loadProjectSearchContext}
          onContinue={this.canContinueWithTaxonAndProject}
        >
          <div className="wizard__page-2__subtitle" />
          <div className="wizard__page-2__searchbar">
            <div className={cs.searchTitle}>Project</div>
            <div>
              {this.state.projectsLoaded ? (
                <ProjectSelect
                  onChange={this.handleSelectProject}
                  projects={projectList}
                  showSelectedItemSubtext={false}
                  value={projectId}
                />
              ) : (
                <IconLoading />
              )}
            </div>
          </div>
          <div className="wizard__page-2__searchbar">
            <div className={cs.searchTitle}>Taxon</div>
            <div>
              <SubtextDropdown
                fluid
                initialSelectedValue={this.state.taxonId}
                onChange={this.handleSelectTaxon}
                onFilterChange={this.handleTaxonInputChange}
                options={this.state.taxonList}
                placeholder="Select taxon"
                search
              />
            </div>
          </div>
          <div>
            {this.state.showErrorTaxonAndProject
              ? "Please select a project and organism"
              : null}
          </div>
        </Wizard.Page>
      ),
      selectNameAndProjectSamples: (
        <Wizard.Page
          key="wizard__page_3"
          title={`Name phylogenetic tree and select samples from project '${this.state.projectName}'`}
          onLoad={this.loadPipelineRunIds}
          onContinueAsync={this.canContinueWithTreeName}
        >
          <div className="wizard__page-3__subtitle">{this.state.taxonName}</div>
          <div className="wizard__page-3__form">
            <div>
              <div className="wizard__page-3__form__label-name">Name</div>
              <Input
                className={
                  this.state.showErrorName &&
                  !this.state.treeNameValid &&
                  !isEmpty(this.state.treeName)
                    ? "error"
                    : ""
                }
                placeholder="Tree Name"
                onChange={this.handleNameChange}
                defaultValue={this.state.treeName}
              />
            </div>
          </div>
          <div className="wizard__page-3__table">
            {projectPipelineRunsLoaded && projectPipelineRunIds.size > 0 ? (
              <InfiniteTable
                headerLabelClassName={cs.columnHeaderLabel}
                columns={COLUMNS.slice(1)} // Exclude the project column
                onLoadRows={this.handleLoadProjectPipelineRunRows}
                onSelectAllRows={this.handleSelectAllProjectPipelineRuns}
                onSelectRow={this.handleSelectProjectPipelineRunsRow}
                rowRenderer={this.rowRenderer}
                selectAllChecked={projectPipelineRunsSelectAllChecked}
                selected={selectedProjectPipelineRuns}
                selectRowDataGetter={({ rowData }) => {
                  // If a run has no contigs, disable the row from being selected.
                  const numContigs = get("num_contigs", rowData);
                  if (numContigs !== 0) {
                    return get("pipeline_run_id", rowData);
                  } else {
                    return null;
                  }
                }}
                selectableKey="pipeline_run_id"
                ref={infiniteTable => (this.infiniteTable = infiniteTable)}
                defaultRowHeight={75}
              />
            ) : projectPipelineRunsLoaded &&
              projectPipelineRunIds.size === 0 ? (
              <div>No samples containing {this.state.taxonName} available</div>
            ) : (
              <IconLoading />
            )}
          </div>
          <div className="wizard__page-3__notifications">
            {this.renderNotifications()}
          </div>
        </Wizard.Page>
      ),
      addIdseqSamples: (
        <Wizard.Page
          key="wizard__page_4"
          title={`Add additional samples from CZ ID that contain ${this.state.taxonName}?`}
        >
          <div className="wizard__page-4__subtitle" />
          <div className="wizard__page-4__searchbar">
            <div className="wizard__page-4__searchbar__container">
              <Input placeholder="Search" onChange={this.handleFilterChange} />
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedProjectPipelineRuns.size} Project Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedOtherPipelineRuns.size} CZ ID Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.getTotalPageRendering()}
            </div>
          </div>
          <div className="wizard__page-4__table">
            {otherPipelineRunsLoaded && otherPipelineRunIds.size > 0 ? (
              <InfiniteTable
                headerLabelClassName={cs.columnHeaderLabel}
                columns={COLUMNS}
                onLoadRows={this.handleLoadOtherPipelineRunRows}
                onSelectAllRows={this.handleSelectAllOtherPipelineRuns}
                onSelectRow={this.handleSelectOtherPipelineRunsRow}
                rowRenderer={this.rowRenderer}
                selectAllChecked={otherPipelineRunsSelectAllChecked}
                selected={selectedOtherPipelineRuns}
                selectRowDataGetter={({ rowData }) => {
                  const numContigs = get("num_contigs", rowData);
                  // If a run has no contigs, disable the row from being selected.
                  if (numContigs !== 0) {
                    return get("pipeline_run_id", rowData);
                  } else {
                    return null;
                  }
                }}
                selectableKey="pipeline_run_id"
                ref={infiniteTable => (this.infiniteTable = infiniteTable)}
                defaultRowHeight={75}
              />
            ) : otherPipelineRunsLoaded && otherPipelineRunIds.size === 0 ? (
              <div>No samples containing {this.state.taxonName} available</div>
            ) : (
              <IconLoading />
            )}
          </div>
          <div className="wizard__page-4__notifications">
            {this.renderNotifications()}
          </div>
        </Wizard.Page>
      ),
    };
    return options[action];
  };

  getPages = () => {
    let chosenPages = [];
    if (!this.state.skipListTrees) {
      chosenPages.push(this.page("listTrees"));
    }
    if (!this.skipSelectProjectAndTaxon) {
      chosenPages.push(this.page("selectTaxonAndProject"));
    }
    chosenPages.push(
      this.page("selectNameAndProjectSamples"),
      this.page("addIdseqSamples"),
    );
    return chosenPages;
  };

  render() {
    const { onClose } = this.props;
    const { defaultPage, phyloTreesLoaded, skipListTrees } = this.state;

    return (
      <Modal open tall onClose={onClose} xlCloseIcon={true}>
        {phyloTreesLoaded ? (
          <Wizard
            className="phylo-tree-creation-wizard"
            skipPageInfoNPages={skipListTrees ? 0 : 1}
            onComplete={withAnalytics(
              this.handleComplete,
              ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_CREATE_TREE_BUTTON_CLICKED,
            )}
            defaultPage={defaultPage}
            labels={{
              finish: "Create Tree",
            }}
            wizardType="PhyloTreeCreationWizard"
            ref={this.wizard}
          >
            {this.getPages()}
          </Wizard>
        ) : (
          <IconLoading />
        )}
      </Modal>
    );
  }
}

PhyloTreeCreationModal.defaultProps = {
  minCoverageBreadth: 25,
};

PhyloTreeCreationModal.propTypes = {
  admin: PropTypes.number,
  onClose: PropTypes.func,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  minCoverageBreadth: PropTypes.number,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string,
};

PhyloTreeCreationModal.contextType = UserContext;

export default PhyloTreeCreationModal;
