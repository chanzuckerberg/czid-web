import { filter, get, head } from "lodash/fp";
import React from "react";

import { logAnalyticsEvent } from "~/api/analytics";
import { WORKFLOWS } from "~/components/utils/workflows";
import { getConsensusGenomeZipLink } from "~/components/views/report/utils/download";
import SampleMessage from "~/components/views/SampleViewV2/SampleMessage";
import DownloadButton from "~ui/controls/buttons/DownloadButton";
import SecondaryButton from "~ui/controls/buttons/SecondaryButton";
import { IconAlert, LoadingIcon } from "~ui/icons";
import { CONSENSUS_GENOME_DOC_LINK } from "~utils/documentationLinks";
import { openUrl, openUrlInNewTab } from "~utils/links";
import PropTypes from "~utils/propTypes";
import { sampleErrorInfo } from "~utils/sample";

import cs from "./consensus_genome_view.scss";
import csSampleMessage from "./sample_message.scss";

class ConsensusGenomeView extends React.Component {
  renderResults() {
    const { sample } = this.props;
    return (
      <div className={cs.resultsContainer}>
        <div className={cs.section}>
          <div className={cs.header}>Download Consensus Genome Results</div>
          <div className={cs.body}>
            These are your consensus genome result files. You can download them
            all in a .zip file.
          </div>
          <div className={cs.subheader}>This is what you'll get:</div>
          <div className={cs.offsetBody}>
            {/* TODO: Migrate to come from an output file listing what went into the ZIP. */}
            <div className={cs.emphasis}>consensus.fa</div>
            <div className={cs.emphasis}>depths.png</div>
            <div className={cs.emphasis}>report.tsv</div>
            <div className={cs.emphasis}>report.txt</div>
            <div>aligned_reads.bam</div>
            <div>ercc_stats.txt</div>
            <div>no_host_1.fq.gz</div>
            <div>no_host_2.fq.gz</div>
            <div>primertrimmed.bam.bai</div>
            <div>primertrimmed.bam</div>
            <div>stats.json</div>
            <div>variants.vcf.gz</div>
          </div>
          <div>
            <DownloadButton
              text="Download All"
              onClick={() => {
                openUrl(getConsensusGenomeZipLink(sample.id));
                logAnalyticsEvent(
                  "ConsensusGenomeView_download-all-button_clicked",
                  {
                    sampleId: sample.id,
                  }
                );
              }}
            />
          </div>
        </div>
        <div className={cs.section}>
          <div className={cs.header}>
            Learn more about Consensus Genomes in our Help Center
          </div>
          <div className={cs.body}>
            We'll show you how to analyze your samples, how our pipeline works,
            and how to upload them to public repositories.
          </div>
          <div>
            <SecondaryButton
              onClick={() => {
                openUrlInNewTab(CONSENSUS_GENOME_DOC_LINK);
                logAnalyticsEvent(
                  "ConsensusGenomeView_view-help-docs-button_clicked"
                );
              }}
              text="View Help Docs"
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { sample } = this.props;
    const workflow =
      head(
        filter(
          { workflow: WORKFLOWS.CONSENSUS_GENOME.value },
          sample.workflow_runs
        )
      ) || {};

    if (workflow.status === "SUCCEEDED") {
      return this.renderResults();
    } else if (workflow.status === "RUNNING" || !workflow.status) {
      return (
        <SampleMessage
          icon={<LoadingIcon className={csSampleMessage.icon} />}
          link={CONSENSUS_GENOME_DOC_LINK}
          linkText={"Learn about Consensus Genomes"}
          message={"Your Consensus Genome is being generated!"}
          status={"IN PROGRESS"}
          type={"inProgress"}
          onClick={() =>
            logAnalyticsEvent(
              "ConsensusGenomeView_consenus-genome-doc-link_clicked"
            )
          }
        />
      );
    } else {
      // FAILED
      const { link, linkText, message, status, type } = sampleErrorInfo({
        sample,
        error: workflow.input_error || {},
      });
      return (
        <SampleMessage
          icon={<IconAlert type={type} />}
          link={link}
          linkText={linkText}
          message={message}
          status={status}
          type={type}
          onClick={() =>
            logAnalyticsEvent(
              "ConsensusGenomeView_sample-error-info-link_clicked"
            )
          }
        />
      );
    }
  }
}

ConsensusGenomeView.propTypes = {
  sample: PropTypes.object,
};

export default ConsensusGenomeView;
