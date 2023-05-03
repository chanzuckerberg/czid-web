// NOTE(2021-07-22): DiscoveryViewRouter is intended to be the main entrypoint
// into frontend routing in our single-page-ish application. We are creating it
// at this level for namespacing but it could be elevated later on.
//
// - <Switch>s can exist at any level in the routing tree.
// - <Route> works from top-to-bottom, rendering whichever path matches first.
// - See https://reactrouter.com/web/api/match for the properties you can get from 'match' (params, isExact, path, and url).

import React, { useContext } from "react";
import { Route, Switch } from "react-router-dom";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { UserContext } from "~/components/common/UserContext";
import DiscoveryView from "~/components/views/discovery/DiscoveryView";
import UserProfileForm from "~/components/views/discovery/UserProfileForm";
import ImpactPage from "~/components/views/ImpactPage";
import LandingV2 from "~/components/views/LandingV2";
import MetadataDictionary from "~/components/views/metadata/MetadataDictionary";
import PathogenListView from "~/components/views/pathogen_list/PathogenListView";
import PhyloTreeListView from "~/components/views/phylo_tree/PhyloTreeListView";
import SampleView from "~/components/views/SampleView/SampleView";
import FAQPage from "~/components/views/support/FAQPage";
import PrivacyNoticeForUserResearch from "~/components/views/support/PrivacyNoticeForUserResearch";
import PrivacyNoticePreview from "~/components/views/support/PrivacyNoticePreview";
import TermsOfUsePreview from "~/components/views/support/TermsOfUsePreview";

// These props come from Rails .html.erb views via the react_component function in app/assets/src/index.tsx (the entrypoint)
interface DiscoveryViewRouterProps {
  admin: boolean;
  domain: string;
  mapTilerKey: string;
  projectId: number;
  snapshotProjectDescription: string;
  snapshotProjectName: string;
  snapshotShareId: string;
  autoAcctCreationEnabled: boolean;
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
  autoAcctCreationEnabled,
  announcementBannerEnabled,
  emergencyBannerMessage,
}: DiscoveryViewRouterProps) => {
  const { firstSignIn, userSignedIn, userId } = useContext(UserContext);

  if (firstSignIn) {
    trackEvent(ANALYTICS_EVENT_NAMES.DISCOVERY_VIEW_ROUTER_USER_FIRST_SIGN_IN, {
      userId: userId,
    });
  }

  return (
    <Switch>
      {autoAcctCreationEnabled && (
        <Route exact path="/user_profile_form">
          <UserProfileForm />
        </Route>
      )}
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
      <Route exact path="/privacy_preview">
        <PrivacyNoticePreview />
      </Route>
      <Route exact path="/terms_preview">
        <TermsOfUsePreview />
      </Route>
      <Route exact path="/metadata/dictionary">
        <MetadataDictionary />
      </Route>
      <Route exact path="/faqs">
        <FAQPage />
      </Route>
      {userSignedIn ? (
        <Route>
          <DiscoveryView
            admin={admin}
            domain={domain}
            mapTilerKey={mapTilerKey}
            projectId={projectId}
            snapshotProjectDescription={snapshotProjectDescription}
            snapshotProjectName={snapshotProjectName}
            snapshotShareId={snapshotShareId}
          />
        </Route>
      ) : (
        <Route>
          <LandingV2
            autoAcctCreationEnabled={autoAcctCreationEnabled}
            announcementBannerEnabled={announcementBannerEnabled}
            emergencyBannerMessage={emergencyBannerMessage}
          />
        </Route>
      )}
    </Switch>
  );
};

export default DiscoveryViewRouter;
