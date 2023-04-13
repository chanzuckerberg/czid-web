// An overlay sidebar that appears on the right.
// Currently used for sample details and taxon details.
// You should add a new mode to this sidebar instead of adding a new sidebar.

import React, { useContext } from "react";
import Sidebar from "~/components/ui/containers/Sidebar";
import { APOLLO_CLIENT_STATE_MANAGEMENT } from "~/components/utils/features";
import { UserContext } from "../UserContext";
import BulkDownloadDetailsMode, { BDDProps } from "./BulkDownloadDetailsMode";
import { BulkDownloadDetailsModeWithApollo } from "./BulkDownloadDetailsModeWithApollo";
import GeneDetailsMode, { GDMProps } from "./GeneDetailsMode";
import PipelineStepDetailsMode, { PSDProps } from "./PipelineStepDetailsMode";
import { PipelineStepDetailsModeWithApollo } from "./PipelineStepDetailsModeWithApollo";
import SampleDetailsMode, { SampleDetailsModeProps } from "./SampleDetailsMode";
import { TaxonDetailsMode, TaxonDetailsModeProps } from "./TaxonDetailsMode";

interface SidebarBase {
  visible: boolean;
  onClose: () => void;
}

interface SampleDetailsSidebar extends SidebarBase {
  mode: "sampleDetails";
  params: SampleDetailsModeProps;
}
interface TaxonDetailsSidebar extends SidebarBase {
  mode: "taxonDetails";
  params: TaxonDetailsModeProps;
}
interface PipelineDetailsSidebar extends SidebarBase {
  mode: "pipelineStepDetails";
  params: PSDProps;
}
interface GeneDetailsSidebar extends SidebarBase {
  mode: "geneDetails";
  params: GDMProps;
}
interface BulkDownloadsDetailsSidebar extends SidebarBase {
  mode: "bulkDownloadDetails";
  params: BDDProps;
}

type DetailsSidebarProps =
  | SampleDetailsSidebar
  | TaxonDetailsSidebar
  | PipelineDetailsSidebar
  | GeneDetailsSidebar
  | BulkDownloadsDetailsSidebar;

const DetailsSidebar = ({
  mode,
  onClose,
  params,
  visible,
}: DetailsSidebarProps) => {
  const { allowedFeatures = [] } = useContext(UserContext) || {};
  const apolloClientEnabled = allowedFeatures.includes(
    APOLLO_CLIENT_STATE_MANAGEMENT,
  );
  const renderContents = () => {
    if (!visible) {
      return null;
    }

    switch (mode) {
      case "sampleDetails":
        return <SampleDetailsMode {...params} />;
      case "taxonDetails":
        return <TaxonDetailsMode {...params} />;
      case "pipelineStepDetails":
        if (apolloClientEnabled) {
          return <PipelineStepDetailsModeWithApollo {...params} />;
        }

        return <PipelineStepDetailsMode {...params} />;
      case "geneDetails":
        return <GeneDetailsMode {...params} />;
      case "bulkDownloadDetails":
        if (apolloClientEnabled) {
          return <BulkDownloadDetailsModeWithApollo />;
        }
        return <BulkDownloadDetailsMode {...params} />;
      default:
        return null;
    }
  };

  return (
    <Sidebar visible={visible} width="very wide" onClose={onClose}>
      {renderContents()}
    </Sidebar>
  );
};

export default DetailsSidebar;
