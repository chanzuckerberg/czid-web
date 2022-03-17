import { reverse } from "lodash";
import {
  debounce,
  find,
  forEach,
  get,
  isEmpty,
  isUndefined,
  map,
} from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import Moment from "react-moment";
import { Link as RouterLink } from "react-router-dom";

import {
  createPhyloTree,
  getNewPhyloTree,
  getPhyloTrees,
  getProjectsToChooseFrom,
  validatePhyloTreeName,
} from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  logAnalyticsEvent,
  withAnalytics,
} from "~/api/analytics";
import { chooseTaxon } from "~/api/phylo_tree_ngs";
import ProjectSelect from "~/components/common/ProjectSelect";
import { UserContext } from "~/components/common/UserContext";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { PHYLO_TREE_LINK } from "~/components/utils/documentationLinks";
import { formatPercent } from "~/components/utils/format";
import {
  isPipelineFeatureAvailable,
  ACCESSION_COVERAGE_STATS_FEATURE,
} from "~/components/utils/pipeline_versions";
import { showPhyloTreeNotification } from "~/components/views/phylo_tree/PhyloTreeNotification";
import Link from "~ui/controls/Link";
import { SubtextDropdown } from "~ui/controls/dropdowns";
import { IconLoading } from "~ui/icons";
import Notification from "~ui/notifications/Notification";
import Modal from "../../ui/containers/Modal";
import Wizard from "../../ui/containers/Wizard";
import Input from "../../ui/controls/Input";
import DataTable from "../../visualizations/table/DataTable";
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

      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),

      otherSamples: [],
      selectedOtherSamples: new Set(),
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

    this.projectSamplesHeaders = {
      name: "Name",
      host: "Host",
      tissue: "Sample Type",
      location: "Location",
      date: "Date",
      numContigs: "Contigs",
      coverageBreadth: "Coverage Breadth",
    };

    this.otherSamplesHeaders = {
      project: "Project",
      ...this.projectSamplesHeaders,
    };

    this.skipSelectProjectAndTaxon = this.props.projectId && this.props.taxonId;

    this.dagBranch = "";
    this.dagVars = "{}";

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
            logAnalyticsEvent(
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

  loadNewTreeContext = () => {
    const { taxonId, projectId, treeName } = this.state;

    this.setState({ showErrorName: false });

    getNewPhyloTree({
      taxId: taxonId,
      projectId,
    }).then(({ samples }) => this.handleNewTreeContextResponse(samples));

    if (this.wizard.current) {
      const continueEnabled = !isEmpty(treeName);
      this.wizard.current.handleContinueEnabled(continueEnabled);
    }
  };

  handleNewTreeContextResponse = samples => {
    if (!samples || !Array.isArray(samples)) {
      // TODO: properly handle error
      // eslint-disable-next-line no-console
      console.error("Error loading samples data");
    } else if (isEmpty(samples)) {
      this.setState({
        samplesLoaded: true,
      });
    } else {
      const { projectSamples, otherSamples } = this.parseProjectSamplesData(
        samples,
      );

      this.setState({
        projectSamples,
        otherSamples,
        samplesLoaded: true,
      });
    }
  };

  parseProjectSamplesData = samples => {
    const projectSamples = [];
    const otherSamples = [];

    forEach(sample => {
      let formattedSample = {
        name: sample.name,
        host: sample.host,
        tissue: sample.tissue,
        location: sample.location,
        date: <Moment fromNow date={sample.created_at} />,
        pipelineRunId: sample.pipeline_run_id,
      };

      const numContigs = get("num_contigs", sample);

      formattedSample = {
        numContigs,
        ...(numContigs === 0 && {
          shouldDisable: true,
          tooltipInfo: {
            position: "top center",
            content:
              "There must be at least 1 contig in the sample for it to be selected for inclusion in the tree.",
          },
        }),
        ...formattedSample,
      };

      const coverageBreadth = get("coverage_breadth", sample);
      const pipelineVersion = get("pipeline_version", sample);
      const hasCoverageBreadth = isPipelineFeatureAvailable(
        ACCESSION_COVERAGE_STATS_FEATURE,
        pipelineVersion,
      );

      formattedSample = {
        coverageBreadth:
          hasCoverageBreadth || numContigs === 0
            ? formatPercent(coverageBreadth)
            : "-",
        ...(!hasCoverageBreadth && {
          columnTooltips: {
            coverageBreadth: {
              position: "top center",
              offset: [-5, 0],
              content:
                "Not shown for samples on pipeline versions older than 6.0.",
            },
          },
        }),
        ...formattedSample,
      };

      if (sample.project_id === this.state.projectId) {
        projectSamples.push(formattedSample);
      } else {
        formattedSample.project = sample.project_name;
        otherSamples.push(formattedSample);
      }
    }, samples);

    return {
      projectSamples: reverse(projectSamples),
      otherSamples: reverse(otherSamples),
    };
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
        samplesLoaded: false,
        projectSamples: [],
        selectedProjectSamples: new Set(),
        otherSamples: [],
        selectedOtherSamples: new Set(),
        otherSamplesFilter: "",
      },
      () =>
        logAnalyticsEvent(
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
        samplesLoaded: false,
        projectSamples: [],
        selectedProjectSamples: new Set(),
        otherSamples: [],
        selectedOtherSamples: new Set(),
        otherSamplesFilter: "",
      },
      () =>
        logAnalyticsEvent(
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

  handleChangedProjectSamples = newSelectedProjectSamples => {
    const {
      selectedProjectSamples: previousSelectedProjectSamples,
    } = this.state;

    this.setState(
      {
        selectedProjectSamples: newSelectedProjectSamples,
      },
      () => {
        logAnalyticsEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_PROJECT_SAMPLES_CHANGED,
          {
            previousSelectedProjectSamples: Array.from(
              previousSelectedProjectSamples,
            ),
            newSelectedProjectSamples: Array.from(newSelectedProjectSamples),
          },
        );
      },
    );
  };

  handleChangedOtherSamples = newSelectedOtherSamples => {
    const { selectedOtherSamples: previousSelectedOtherSamples } = this.state;

    this.setState(
      {
        selectedOtherSamples: newSelectedOtherSamples,
      },
      () => {
        logAnalyticsEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_OTHER_SAMPLES_CHANGED,
          {
            previousSelectedOtherSamples: Array.from(
              previousSelectedOtherSamples,
            ),
            newSelectedOtherSamples: Array.from(newSelectedOtherSamples),
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
        },
        () => {
          logAnalyticsEvent(
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

  handleBranchChange = newBranch => {
    this.dagBranch = newBranch.trim();
  };

  handleDagVarsChange = newDagVars => {
    this.dagVars = newDagVars;
  };

  handleCreation = () => {
    const {
      treeName,
      projectId,
      selectedProjectSamples,
      selectedOtherSamples,
      taxonId,
    } = this.state;
    const { onClose } = this.props;

    const totalNumberOfSamplesSelected =
      selectedProjectSamples.size + selectedOtherSamples.size;
    const numberOfSamplesIsValid = PhyloTreeChecks.isNumberOfSamplesValid(
      totalNumberOfSamplesSelected,
    );

    if (!numberOfSamplesIsValid) {
      this.setState(
        {
          showErrorSamples: true,
        },
        () =>
          logAnalyticsEvent(
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

    const pipelineRunIds = [];
    this.state.selectedProjectSamples.forEach(rowIndex => {
      pipelineRunIds.push(this.state.projectSamples[rowIndex].pipelineRunId);
    });
    this.state.selectedOtherSamples.forEach(rowIndex => {
      pipelineRunIds.push(this.state.otherSamples[rowIndex].pipelineRunId);
    });

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
        logAnalyticsEvent(
          ANALYTICS_EVENT_NAMES.PHYLO_TREE_CREATION_MODAL_NG_CREATION_SUCCESSFUL,
          {
            treeId: phyloTreeId,
            ...sharedAnalyticsPayload,
          },
        );

        showPhyloTreeNotification();
        onClose();
      } else {
        logAnalyticsEvent(
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
      this.state.selectedProjectSamples.size +
      this.state.selectedOtherSamples.size;
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

    logAnalyticsEvent(
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
      this.state.selectedProjectSamples.size +
      this.state.selectedOtherSamples.size;
    return `${totalSelectedSamples} Total Samples`;
  }

  renderNotifications() {
    const {
      treeName,
      treeNameValid,
      showErrorSamples,
      showErrorName,
      selectedProjectSamples,
      selectedOtherSamples,
      projectSamples,
      otherSamples,
    } = this.state;

    const lowCoverageBreadths = [];
    selectedProjectSamples.forEach(sampleIndex => {
      const coverageBreadthPercentage =
        projectSamples[sampleIndex].coverageBreadth;
      const coverageBreadth = parseFloat(
        coverageBreadthPercentage.slice(0, coverageBreadthPercentage.length),
      );
      if (coverageBreadth < 25) {
        lowCoverageBreadths.push(coverageBreadth);
      }
    });
    selectedOtherSamples.forEach(sampleIndex => {
      const coverageBreadthPercentage =
        otherSamples[sampleIndex].coverageBreadth;
      const coverageBreadth = parseFloat(
        coverageBreadthPercentage.slice(0, coverageBreadthPercentage.length),
      );
      if (coverageBreadth < 25) {
        lowCoverageBreadths.push(coverageBreadth);
      }
    });
    const showLowCoverageWarning = lowCoverageBreadths.length > 0;

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
          Some of the samples you have selected have low coverage breadth, under
          25%. This may reduce the quality of the output results.{" "}
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
    const { projectList, projectId } = this.state;

    const projectSamplesColumns = [
      "name",
      "host",
      "tissue",
      "location",
      "date",
      "numContigs",
      "coverageBreadth",
    ];
    const otherSamplesColumns = ["project", ...projectSamplesColumns];

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
                logAnalyticsEvent(
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
          onLoad={this.loadNewTreeContext}
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
            {this.props.admin === 1 && (
              <div>
                <div className="wizard__page-3__form__label-branch">Branch</div>
                <Input
                  placeholder="master"
                  onChange={this.handleBranchChange}
                />
                <div className="wizard__page-3__form__label-branch">
                  DAG variables
                </div>
                <Input placeholder="{}" onChange={this.handleDagVarsChange} />
              </div>
            )}
          </div>
          <div className="wizard__page-3__table">
            {this.state.samplesLoaded &&
            this.state.projectSamples.length > 0 ? (
              <DataTable
                headers={this.projectSamplesHeaders}
                columns={projectSamplesColumns}
                data={this.state.projectSamples}
                selectedRows={this.state.selectedProjectSamples}
                onSelectedRowsChanged={this.handleChangedProjectSamples}
              />
            ) : this.state.samplesLoaded &&
              this.state.projectSamples.length === 0 ? (
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
              {this.state.selectedProjectSamples.size} Project Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedOtherSamples.size} CZ ID Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.getTotalPageRendering()}
            </div>
          </div>
          <div className="wizard__page-4__table">
            {this.state.samplesLoaded && this.state.otherSamples.length > 0 ? (
              <DataTable
                headers={this.otherSamplesHeaders}
                columns={otherSamplesColumns}
                data={this.state.otherSamples}
                selectedRows={this.state.selectedOtherSamples}
                onSelectedRowsChanged={this.handleChangedOtherSamples}
                filter={this.state.otherSamplesFilter}
              />
            ) : this.state.samplesLoaded &&
              this.state.otherSamples.length === 0 ? (
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

PhyloTreeCreationModal.propTypes = {
  admin: PropTypes.number,
  csrf: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string,
};

PhyloTreeCreationModal.contextType = UserContext;

export default PhyloTreeCreationModal;
