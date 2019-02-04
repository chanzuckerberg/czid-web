// An overlay sidebar that appears on the right.
// Currently used for sample details and taxon details.
// You should add a new mode to this sidebar instead of adding a new sidebar.

import React from "react";
import SampleDetailsMode from "./SampleDetailsMode";
import TaxonDetailsMode from "./TaxonDetailsMode";
import Sidebar from "~/components/ui/containers/Sidebar";
import PropTypes from "~/components/utils/propTypes";

export default class DetailsSidebar extends React.Component {
  renderContents() {
    if (!this.props.visible) {
      return null;
    }

    if (this.props.mode === "sampleDetails") {
      return <SampleDetailsMode {...this.props.params} />;
    }

    if (this.props.mode === "taxonDetails") {
      return <TaxonDetailsMode {...this.props.params} />;
    }

    return null;
  }

  render() {
    const { visible, onClose } = this.props;

    return (
      <Sidebar visible={visible} width="very wide" onClose={onClose}>
        {this.renderContents()}
      </Sidebar>
    );
  }
}

DetailsSidebar.propTypes = {
  mode: PropTypes.string,
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  params: PropTypes.any // the params that are required depends on the mode. See subclasses like SampleDetailsMode for needed params.
};
