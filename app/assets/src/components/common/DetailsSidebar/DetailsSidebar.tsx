// An overlay sidebar that appears on the right.
// Currently used for sample details and taxon details.
// You should add a new mode to this sidebar instead of adding a new sidebar.

import { LoadingIndicator } from "@czi-sds/components";
import React, { Suspense } from "react";
import Sidebar from "~/components/ui/containers/Sidebar";
import {
  BulkDownloadDetailsMode,
  BulkDownloadDetailsProps,
} from "./BulkDownloadDetailsMode";
import cs from "./details_sidebar.scss";
import GeneDetailsMode, { GDMProps } from "./GeneDetailsMode";
import PipelineStepDetailsMode, { PSDProps } from "./PipelineStepDetailsMode";
import { SampleDetailsMode, SampleDetailsModeProps } from "./SampleDetailsMode";
import { TaxonDetailsMode, TaxonDetailsModeProps } from "./TaxonDetailsMode";
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
    | BulkDownloadDetailsProps
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
  const renderContents = () => {
    if (!visible) {
      return null;
    }

    switch (mode) {
      case "sampleDetails":
        return (
          <Suspense
            fallback={
              <div className={cs.loading}>
                <LoadingIndicator sdsStyle="minimal" />
              </div>
            }
          >
            <SampleDetailsMode {...(params as SampleDetailsModeProps)} />
          </Suspense>
        );
      case "taxonDetails":
        return <TaxonDetailsMode {...(params as TaxonDetailsModeProps)} />;
      case "pipelineStepDetails":
        return <PipelineStepDetailsMode {...(params as PSDProps)} />;
      case "geneDetails":
        return <GeneDetailsMode {...(params as GDMProps)} />;
      case "bulkDownloadDetails":
        return (
          <BulkDownloadDetailsMode {...(params as BulkDownloadDetailsProps)} />
        );
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
