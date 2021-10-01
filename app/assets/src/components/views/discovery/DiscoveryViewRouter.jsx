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
import Landing from "~/components/views/Landing";
import LandingV2 from "~/components/views/LandingV2";
import SampleView from "~/components/views/SampleView/SampleView";
import DiscoveryView from "~/components/views/discovery/DiscoveryView";
import { DISCOVERY_DOMAINS } from "~/components/views/discovery/discovery_api";
import PhyloTreeListView from "~/components/views/phylo_tree/PhyloTreeListView";

const DiscoveryViewRouter = ({
  admin,
  allowedFeatures,
  browserInfo,
  contactEmail,
  domain,
  landingV2,
  mapTilerKey,
  projectId,
  showAnnouncementBanner,
  showBulletin,
  showPublicSite,
  snapshotProjectDescription,
  snapshotProjectName,
  snapshotShareId,
  updateDiscoveryProjectId,
}) => {
  const { userSignedIn } = useContext(UserContext);
  return (
    <Switch>
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
      {userSignedIn && (
        <Route exact path="/landing_v2">
          <LandingV2 />
        </Route>
      )}
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
          {landingV2 ? (
            <LandingV2 />
          ) : (
            <Landing
              browserInfo={browserInfo}
              contactEmail={contactEmail}
              showAnnouncementBanner={showAnnouncementBanner}
              showBulletin={showBulletin}
              showPublicSite={showPublicSite}
            />
          )}
        </Route>
      )}
    </Switch>
  );
};

DiscoveryViewRouter.propTypes = {
  admin: PropTypes.bool,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  browserInfo: PropTypes.object,
  contactEmail: PropTypes.string,
  domain: PropTypes.oneOf(DISCOVERY_DOMAINS),
  landingV2: PropTypes.bool,
  mapTilerKey: PropTypes.string,
  projectId: PropTypes.number,
  showAnnouncementBanner: PropTypes.bool,
  showBulletin: PropTypes.bool,
  showPublicSite: PropTypes.bool,
  snapshotProjectDescription: PropTypes.string,
  snapshotProjectName: PropTypes.string,
  snapshotShareId: PropTypes.string,
  updateDiscoveryProjectId: PropTypes.func,
};

export default DiscoveryViewRouter;
