// An overlay sidebar that appears on the right.
// Currently used for sample details and taxon details.
// You should add a new mode to this sidebar instead of adding a new sidebar.

import React from "react";

import Sidebar from "~/components/ui/containers/Sidebar";
import PropTypes from "~/components/utils/propTypes";

import BulkDownloadDetailsMode from "./BulkDownloadDetailsMode";
import SampleDetailsMode from "./SampleDetailsMode";
import TaxonDetailsMode from "./TaxonDetailsMode";
import PipelineStepDetailsMode from "./PipelineStepDetailsMode";
import GeneDetailsMode from "./GeneDetailsMode";

const DetailsSidebar = ({ mode, onClose, params, visible }) => {
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
        return <PipelineStepDetailsMode {...params} />;
      case "geneDetails":
        return <GeneDetailsMode {...params} />;
      case "bulkDownloadDetails":
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

DetailsSidebar.propTypes = {
  mode: PropTypes.string,
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  params: PropTypes.any, // the params that are required depends on the mode. See subclasses like SampleDetailsMode for needed params.
};

export default DetailsSidebar;
