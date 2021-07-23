// NOTE(2021-07-22): DiscoveryViewRouter is intended to be the main entrypoint
// into frontend routing in our single-page-ish application. We are creating it
// at this level for namespacing but it could be elevated later on.
//
// - <Switch>s can exist at any level in the routing tree.
// - <Route> works from top-to-bottom, rendering whichever path matches first.
// - See https://reactrouter.com/web/api/match for the properties you can get from 'match' (params, isExact, path, and url).

import PropTypes from "prop-types";
import React from "react";
import { Switch, Route } from "react-router-dom";

import DiscoveryView from "~/components/views/discovery/DiscoveryView";
import { DISCOVERY_DOMAINS } from "~/components/views/discovery/discovery_api";
import PhyloTreeListView from "~/components/views/phylo_tree/PhyloTreeListView";

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
}) => {
  return (
    <Switch>
      <Route
        path="/phylo_tree_ngs/:id"
        render={({ match }) => (
          <PhyloTreeListView selectedPhyloTreeNgId={match.params.id} />
        )}
      />
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
    </Switch>
  );
};

DiscoveryViewRouter.propTypes = {
  admin: PropTypes.bool,
  allowedFeatures: PropTypes.arrayOf(PropTypes.string),
  domain: PropTypes.oneOf(DISCOVERY_DOMAINS).isRequired,
  mapTilerKey: PropTypes.string,
  projectId: PropTypes.number,
  snapshotProjectName: PropTypes.string,
  snapshotProjectDescription: PropTypes.string,
  snapshotShareId: PropTypes.string,
  updateDiscoveryProjectId: PropTypes.func,
};

export default DiscoveryViewRouter;
