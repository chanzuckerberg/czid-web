// NOTE(2021-07-22): DiscoveryViewRouter is intended to be the main entrypoint
// into frontend routing in our single-page-ish application. We are creating it
// at this level for namespacing but it could be elevated later on.
//
// - <Switch>s can exist at any level in the routing tree.
// - <Route> works from top-to-bottom, rendering whichever path matches first.
// - See https://reactrouter.com/web/api/match for the properties you can get from 'match' (params, isExact, path, and url).

import React, { Suspense, useContext } from "react";
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import { LoadingPage } from "~/components/common/LoadingPage";
import { UserContext } from "~/components/common/UserContext";
import UserProfileForm from "~/components/views/discovery/UserProfileForm";
import { FAQPage } from "~/components/views/FAQPage";
import { ImpactPage } from "~/components/views/ImpactPage/ImpactPage";
import { MetadataDictionary } from "~/components/views/MetadataDictionary";
import { PathogenListView } from "~/components/views/PathogenListView";
import PhyloTreeListView from "~/components/views/PhyloTree/PhyloTreeListView";
import { PrivacyNoticeForUserResearch } from "~/components/views/PrivacyNoticeForUserResearch";
import SampleView from "~/components/views/SampleView";
import { AdminPage } from "../AdminPage";
import { AdminProject } from "../AdminProject";
import { AdminSample } from "../AdminSample";
import { AdminSettings } from "../AdminSettings";
import { LandingPage } from "../LandingPage";
import { DiscoveryViewFC } from "./DiscoveryViewFC";

// These props come from Rails .html.erb views via the react_component function in app/assets/src/index.tsx (the entrypoint)
interface DiscoveryViewRouterProps {
  admin: boolean;
  domain: string;
  mapTilerKey: string;
  projectId: string;
  snapshotProjectDescription: string;
  snapshotProjectName: string;
  snapshotShareId: string;
  announcementBannerEnabled: boolean;
  emergencyBannerMessage: string;
}

const DiscoveryViewRouter = ({
  admin,
  domain,
  mapTilerKey,
  projectId,
  snapshotProjectDescription,
  snapshotProjectName,
  snapshotShareId,
  announcementBannerEnabled,
  emergencyBannerMessage,
}: DiscoveryViewRouterProps) => {
  const { userSignedIn } = useContext(UserContext);
  const history = useHistory();
  const location = useLocation();

  return (
    <>
      <Switch>
        <Route exact path="/user_profile_form">
          <UserProfileForm />
        </Route>
        <Route exact path="/impact">
          <ImpactPage />
        </Route>
        <Route exact path="/pathogen_list">
          <Suspense fallback={<LoadingPage />}>
            <PathogenListView />
          </Suspense>
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
            <DiscoveryViewFC
              domain={domain}
              projectId={projectId}
              snapshotProjectDescription={snapshotProjectDescription}
              snapshotProjectName={snapshotProjectName}
              snapshotShareId={match.params.snapshotShareId}
              history={history}
              location={location}
              match={match}
            />
          )}
        />
        <Route exact path="/metadata/dictionary">
          <MetadataDictionary />
        </Route>
        <Route exact path="/faqs">
          <FAQPage />
        </Route>
        <Route exact path="/admin">
          <AdminPage />
        </Route>
        <Route path="/admin/settings">
          <AdminSettings />
        </Route>
        <Route
          path="/admin/samples/:sampleId"
          render={({ match }) => (
            <AdminSample sampleId={match.params.sampleId} />
          )}
        />
        <Route
          path="/admin/projects/:projectId"
          render={({ match }) => (
            <AdminProject projectId={match.params.projectId} />
          )}
        />
        {userSignedIn ? (
          <Route
            render={({ match }) => (
              <DiscoveryViewFC
                admin={admin}
                domain={domain}
                mapTilerKey={mapTilerKey}
                projectId={projectId}
                snapshotProjectDescription={snapshotProjectDescription}
                snapshotProjectName={snapshotProjectName}
                snapshotShareId={snapshotShareId}
                history={history}
                location={location}
                match={match}
              />
            )}
          />
        ) : (
          <Route>
            <LandingPage
              announcementBannerEnabled={announcementBannerEnabled}
              emergencyBannerMessage={emergencyBannerMessage}
            />
          </Route>
        )}
      </Switch>
    </>
  );
};

export default DiscoveryViewRouter;
