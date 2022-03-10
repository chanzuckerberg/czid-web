// NOTE(2021-07-22): DiscoveryViewRouter is intended to be the main entrypoint
// into frontend routing in our single-page-ish application. We are creating it
// at this level for namespacing but it could be elevated later on.
//
// - <Switch>s can exist at any level in the routing tree.
// - <Route> works from top-to-bottom, rendering whichever path matches first.
// - See https://reactrouter.com/web/api/match for the properties you can get from 'match' (params, isExact, path, and url).

import PropTypes from "prop-types";
import React, { useContext } from "react";
import { Route, Switch } from "react-router-dom";

import { UserContext } from "~/components/common/UserContext";
import ImpactPage from "~/components/views/ImpactPage";
import LandingV2 from "~/components/views/LandingV2";
import SampleView from "~/components/views/SampleView/SampleView";
import DiscoveryView from "~/components/views/discovery/DiscoveryView";
import { DISCOVERY_DOMAINS } from "~/components/views/discovery/discovery_api";
import PathogenListView from "~/components/views/pathogen_list/PathogenListView";
import PhyloTreeListView from "~/components/views/phylo_tree/PhyloTreeListView";
import PrivacyNoticeForUserResearch from "~/components/views/support/PrivacyNoticeForUserResearch";

const DiscoveryViewRouter = ({
  admin,
  allowedFeatures,
  domain,
  mapTilerKey,
  projectId,
  snapshotProjectDescription,
  snapshotProjectName,
  snapshotShareId,
  updateDiscoveryProjectId,
  announcementBannerEnabled,
  emergencyBannerMessage,
}) => {
  const { userSignedIn } = useContext(UserContext);
  return (
    <Switch>
      <Route exact path="/impact">
        <ImpactPage />
      </Route>
      <Route exact path="/pathogen_list">
        <PathogenListView />
      </Route>
      <Route exact path="/privacy_notice_for_user_research">
        <PrivacyNoticeForUserResearch />
      </Route>
      <Route
        path="/phylo_tree_ngs/:id"
        render={({ match }) => (
          <PhyloTreeListView
            selectedPhyloTreeNgId={parseInt(match.params.id)}
          />
        )}
      />
      <Route
        path="/samples/:id"
        render={({ match }) => (
          <SampleView sampleId={parseInt(match.params.id)} />
        )}
      />
      <Route
        path="/pub/:snapshotShareId/samples/:sampleId"
        render={({ match }) => (
          <SampleView
            sampleId={parseInt(match.params.sampleId)}
            snapshotShareId={match.params.snapshotShareId}
          />
        )}
      />
      <Route
        path="/pub/:snapshotShareId"
        render={({ match }) => (
          <DiscoveryView
            domain={domain}
            projectId={projectId}
            snapshotProjectDescription={snapshotProjectDescription}
            snapshotProjectName={snapshotProjectName}
            snapshotShareId={match.params.snapshotShareId}
          />
        )}
      />
      {userSignedIn ? (
        <Route>
          <DiscoveryView
            admin={admin}
            allowedFeatures={allowedFeatures}
            domain={domain}
            mapTilerKey={mapTilerKey}
            projectId={projectId}
            snapshotProjectDescription={snapshotProjectDescription}
            snapshotProjectName={snapshotProjectName}
            snapshotShareId={snapshotShareId}
            updateDiscoveryProjectId={updateDiscoveryProjectId}
          />
        </Route>
      ) : (
        <Route>
          <LandingV2
            announcementBannerEnabled={announcementBannerEnabled}
            emergencyBannerMessage={emergencyBannerMessage}
          />
        </Route>
      )}
    </Switch>
  );
};

DiscoveryViewRouter.propTypes = {
  admin: PropTypes.bool,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  domain: PropTypes.oneOf(DISCOVERY_DOMAINS),
  mapTilerKey: PropTypes.string,
  projectId: PropTypes.number,
  snapshotProjectDescription: PropTypes.string,
  snapshotProjectName: PropTypes.string,
  snapshotShareId: PropTypes.string,
  updateDiscoveryProjectId: PropTypes.func,
  announcementBannerEnabled: PropTypes.bool,
  emergencyBannerMessage: PropTypes.string,
};

export default DiscoveryViewRouter;
