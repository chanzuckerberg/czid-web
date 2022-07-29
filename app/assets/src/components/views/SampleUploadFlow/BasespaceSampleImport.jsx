import { set, isEmpty, map, get, head, find, isArray } from "lodash/fp";
import React from "react";

import { withAnalytics } from "~/api/analytics";
import {
  getBasespaceProjects,
  getSamplesForBasespaceProject,
} from "~/api/basespace";
import LoadingMessage from "~/components/common/LoadingMessage";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import PropTypes from "~/components/utils/propTypes";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import Notification from "~ui/notifications/Notification";

import cs from "./basespace_sample_import.scss";
import { NO_TARGET_PROJECT_ERROR } from "./constants";
import { openBasespaceOAuthPopup } from "./utils";

export default class BasespaceSampleImport extends React.Component {
  state = {
    basespaceProjects: null,
    selectedProjectId: null,
    loadingSamples: false,
    error: "",
    errorType: "",
  };

  componentDidMount() {
    const { accessToken } = this.props;
    window.addEventListener("message", this.handleMessageEvent);
    if (accessToken) {
      this.fetchBasespaceProjects(accessToken);
    }
  }

  componentDidUpdate() {
    if (
      this.state.error === NO_TARGET_PROJECT_ERROR &&
      this.props.project !== null
    ) {
      this.setState({
        error: "",
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.handleMessageEvent);
  }

  handleMessageEvent = async event => {
    const { onAccessTokenChange } = this.props;
    if (
      event.source === this._window &&
      event.origin === window.location.origin &&
      event.data.basespaceAccessToken
    ) {
      const accessToken = event.data.basespaceAccessToken;
      this.fetchBasespaceProjects(accessToken);
      onAccessTokenChange(accessToken);
    }
  };

  handleProjectSelect = projectId => {
    this.setState({
      selectedProjectId: projectId,
    });
  };

  requestBasespaceBrowseGlobalPermissions = () => {
    const { basespaceClientId, basespaceOauthRedirectUri } = this.props;

    this._window = openBasespaceOAuthPopup({
      client_id: basespaceClientId,
      redirect_uri: basespaceOauthRedirectUri,
      scope: "browse+global",
    });
  };

  getProjectOptions = () => {
    const { basespaceProjects } = this.state;

    return map(
      project => ({
        value: project.id,
        text: project.name,
      }),
      basespaceProjects,
    );
  };

  fetchBasespaceProjects = async accessToken => {
    const projects = await getBasespaceProjects(accessToken);

    const newState = {
      basespaceProjects: projects,
      selectedProjectId: get("id", head(projects)),
    };

    // If no projects are found, show the user an error.
    if (isEmpty(projects)) {
      newState.error =
        "No projects found in logged-in Basespace account. Please contact us for help.";
      newState.errorType = "error";
    }

    this.setState(newState);
  };

  fetchSamplesForBasespaceProject = async () => {
    const { selectedProjectId, basespaceProjects } = this.state;
    const { onChange, accessToken, project, onNoProject } = this.props;

    if (!this.props.project) {
      this.setState({
        error: NO_TARGET_PROJECT_ERROR,
        errorType: "error",
      });
      onNoProject();
      return;
    } else {
      this.setState({
        error: "",
      });
    }

    this.setState({ loadingSamples: true });

    let samples = await getSamplesForBasespaceProject(
      accessToken,
      selectedProjectId,
    );

    this.setState({ loadingSamples: false });

    const currentProjectName = get(
      "name",
      find(["id", selectedProjectId], basespaceProjects),
    );

    if (samples.error) {
      this.setState({
        error: `There was an error accessing project ${currentProjectName}. Please contact us for help.`,
        errorType: "error",
      });
      return;
    }

    // Add the current project id to each sample.
    samples = map(set("project_id", project.id), samples);

    if (isEmpty(samples)) {
      this.setState({
        error: `No valid samples could be found in project ${currentProjectName}`,
        errorType: "warning",
      });
    }

    onChange(samples);
  };

  renderConnectButton = () => {
    return (
      <React.Fragment>
        <div className={cs.helpText}>
          Please connect to Basespace and authorize CZ ID to view your projects
          and samples.
        </div>
        <PrimaryButton
          text="Connect to Basespace"
          rounded={false}
          onClick={withAnalytics(
            this.requestBasespaceBrowseGlobalPermissions,
            "BasespaceSampleImport_connect-btn_clicked",
            {},
          )}
        />
      </React.Fragment>
    );
  };

  renderProjectSelect = () => {
    const {
      basespaceProjects,
      selectedProjectId,
      loadingSamples,
      error,
      errorType,
    } = this.state;

    const noBasespaceProjectsFound =
      isArray(basespaceProjects) && isEmpty(basespaceProjects);

    return (
      <React.Fragment>
        <div className={cs.label}>Select Basespace Project</div>
        <div className={cs.projectSelectContainer}>
          <Dropdown
            disabled={noBasespaceProjectsFound}
            placeholder={
              noBasespaceProjectsFound
                ? "No projects found"
                : "Loading projects..."
            }
            fluid
            floating
            scrolling
            options={this.getProjectOptions()}
            onChange={this.handleProjectSelect}
            value={selectedProjectId}
          />
          <PrimaryButton
            disabled={isEmpty(basespaceProjects)} // disable if no projects found and also if projects are loading.
            text="Connect to Project"
            rounded={false}
            onClick={withAnalytics(
              this.fetchSamplesForBasespaceProject,
              "BasespaceSampleImport_connect-project-btn_clicked",
              {},
            )}
            className={cs.connectProjectButton}
          />
        </div>
        {loadingSamples && (
          <LoadingMessage
            message="Loading samples..."
            className={cs.loadingMessage}
          />
        )}
        {this.state.error && (
          <Notification
            type={errorType}
            displayStyle="flat"
            className={cs.notification}
          >
            {error}
          </Notification>
        )}
      </React.Fragment>
    );
  };

  render() {
    const { accessToken } = this.props;
    return (
      <div className={cs.basespaceSampleImport}>
        {accessToken ? this.renderProjectSelect() : this.renderConnectButton()}
      </div>
    );
  }
}

BasespaceSampleImport.propTypes = {
  onChange: PropTypes.func.isRequired,
  accessToken: PropTypes.string,
  onAccessTokenChange: PropTypes.func.isRequired,
  project: PropTypes.Project,
  basespaceClientId: PropTypes.string.isRequired,
  basespaceOauthRedirectUri: PropTypes.string.isRequired,
  onNoProject: PropTypes.func.isRequired,
};
