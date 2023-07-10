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
import { TaxonDetailsModeWithApollo } from "./TaxonDetailsModeWithApollo";
interface SidebarBase {
  visible: boolean;
  onClose: () => void;
}

interface DetailsSidebarProps extends SidebarBase {
  mode:
    | "sampleDetails"
    | "taxonDetails"
    | "pipelineStepDetails"
    | "geneDetails"
    | "bulkDownloadDetails";
  params:
    | BDDProps
    | GDMProps
    | PSDProps
    | SampleDetailsModeProps
    | TaxonDetailsModeProps;
}

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
        return <SampleDetailsMode {...(params as SampleDetailsModeProps)} />;
      case "taxonDetails":
        if (apolloClientEnabled) {
          return (
            <TaxonDetailsModeWithApollo
              {...(params as TaxonDetailsModeProps)}
            />
          );
        }
        return <TaxonDetailsMode {...(params as TaxonDetailsModeProps)} />;
      case "pipelineStepDetails":
        if (apolloClientEnabled) {
          return (
            <PipelineStepDetailsModeWithApollo {...(params as PSDProps)} />
          );
        }
        return <PipelineStepDetailsMode {...(params as PSDProps)} />;
      case "geneDetails":
        return <GeneDetailsMode {...(params as GDMProps)} />;
      case "bulkDownloadDetails":
        if (apolloClientEnabled) {
          return <BulkDownloadDetailsModeWithApollo />;
        }
        return <BulkDownloadDetailsMode {...(params as BDDProps)} />;
      default:
        return null;
    }
  };

  return (
    <Sidebar
      visible={visible}
      width="very wide"
      onClose={onClose}
      data-testid="details-sidebar"
    >
      {renderContents()}
    </Sidebar>
  );
};

export default DetailsSidebar;
