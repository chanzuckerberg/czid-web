import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { validateSampleIds } from "~/api/access_control";
import { WORKFLOWS } from "~utils/workflows";
import { NEXTCLADE_TOOL_DOC_LINK } from "~/components/utils/documentationLinks";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import InfoIconSmall from "~ui/icons/InfoIconSmall";
import Modal from "~ui/containers/Modal";

import cs from "./nextclade_modal.scss";
import NextcladeModalFooter from "./NextcladeModalFooter";

export default class NextcladeModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      invalidSampleNames: [],
      loading: true,
      validationError: null,
      validSampleIds: new Set(),
    };
  }

  componentDidMount() {
    const { selectedSampleIds } = this.props;

    this.fetchSampleValidationInfo(selectedSampleIds);
  }

  fetchSampleValidationInfo = async selectedSampleIds => {
    const {
      validSampleIds,
      invalidSampleNames,
      error,
    } = await validateSampleIds(
      Array.from(selectedSampleIds),
      WORKFLOWS.CONSENSUS_GENOME.value
    );

    this.setState({
      validSampleIds: new Set(validSampleIds),
      invalidSampleNames,
      loading: false,
      validationError: error,
    });
  };

  renderTooltip = ({ content, link, iconStyle = null }) => {
    return (
      <ColumnHeaderTooltip
        trigger={
          <InfoIconSmall className={cx(cs.infoIcon, iconStyle && iconStyle)} />
        }
        content={content}
        link={link}
      />
    );
  };

  render() {
    const { open, onClose, selectedSampleIds } = this.props;
    const {
      invalidSampleNames,
      loading,
      validationError,
      validSampleIds,
    } = this.state;

    return (
      <Modal narrow open={open} tall onClose={onClose}>
        <div className={cs.modal}>
          <div className={cs.nextcladeHeader}>
            <div className={cs.title}>
              View Samples in Nextclade
              {this.renderTooltip({
                content: "Nextclade is a third-party tool.",
                link: NEXTCLADE_TOOL_DOC_LINK,
              })}
            </div>
            <div className={cs.tagline}>
              {selectedSampleIds.size} Sample
              {selectedSampleIds.size !== 1 ? "s" : ""} selected
            </div>
          </div>
          <div className={cs.nextcladeDescription}>
            <div className={cs.title}> Nextclade helps you: </div>
            <ul>
              <li>
                <span>Assess sequence quality</span>
              </li>
              <li>
                <span>
                  See where your samples differ from the reference sequence
                </span>
              </li>
              <li>
                <span>
                  Identify which clade or lineage your samples belong to
                </span>
              </li>
              <li>
                <span>
                  View sample placement in the context of a Nextstrain
                  phylogenetic tree
                </span>
              </li>
            </ul>
          </div>
          <div className={cs.referenceTree}>
            <div className={cs.title}>
              Reference Tree
              {this.renderTooltip({
                content:
                  "Nextclade will graft your sequences onto the reference tree to provide more context.",
                link: "https://chanzuckerberg.zendesk.com/hc/en-us", // TODO: Awaiting correct Zendesk help page link (in progress)
                iconStyle: cs.lower,
              })}
            </div>
          </div>
          <div className={cs.footer}>
            <NextcladeModalFooter
              invalidSampleNames={invalidSampleNames}
              loading={loading}
              validationError={validationError}
              validSampleIds={validSampleIds}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

NextcladeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  selectedSampleIds: PropTypes.instanceOf(Set).isRequired,
};
