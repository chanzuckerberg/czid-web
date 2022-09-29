/* eslint-disable import/order */
import React from "react";
import { Button, Icon, List, ListItem, ListSubheader } from "czifui";
import SampleReportContent from "./SampleReportContent";
import ExternalLink from "~/components/ui/controls/ExternalLink";

import { openUrl } from "~/components/utils/links";
import { getWorkflowRunZipLink } from "../report/utils/download";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";

import cs from "./amr_report_view.scss";
import { trackEvent } from "~/api/analytics";
import Sample, { WorkflowRun } from "~/interface/sample";

interface AmrViewProps {
  loadingResults: boolean;
  workflowRun: WorkflowRun;
  sample: Sample;
}

const AmrView = ({
  workflowRun,
  loadingResults = false,
  sample,
}: AmrViewProps) => {
  const listItems = [
    ["AMR Report", "final_reports/primary_AMR_report.tsv"],
    [
      "Combined AMR Metrics Summary",
      "final_reports/comprehensive_AMR_metrics.tsv",
    ],
    ["Contigs", "contigs.fa"],
    ["Non host reads", "non_host_reads.fa"],
    ["Raw outputs from CARD RGI", "raw_reports/"],
    ["Intermediate files", "intermediate_files/"],
  ];
  const renderResults = () => {
    return (
      <main className={cs.main}>
        <section className={cs.section}>
          <h3 className={cs.title}>
            Download Antimicrobial Resistance (AMR) Results
          </h3>
          <h5 className={cs.subtitle}>
            These are your AMR result files. They were generated using{" "}
            <ExternalLink href={"https://github.com/arpcard/rgi"}>
              RGI
            </ExternalLink>{" "}
            and the{" "}
            <ExternalLink href={"https://card.mcmaster.ca/"}>CARD</ExternalLink>{" "}
            database. You can download all outputs in a .zip file.
          </h5>
        </section>
        <section className={cs.section}>
          <div className={cs.list}>
            <List
              subheader={
                <ListSubheader>This is what you’ll get:</ListSubheader>
              }
            >
              {listItems.map((items, key) => {
                return (
                  <ListItem key={key}>
                    <span className={cs.bolded}>{items[0]}</span>: {items[1]}
                  </ListItem>
                );
              })}
            </List>
          </div>
          <Button
            className={cs.button}
            sdsStyle="rounded"
            sdsType="secondary"
            startIcon={<Icon sdsIcon="download" sdsSize="l" sdsType="button" />}
            onClick={() => {
              openUrl(getWorkflowRunZipLink(workflowRun.id));
              trackEvent("AmrView_download-all-button_clicked", {
                sampleId: sample.id,
              });
            }}
          >
            Download All
          </Button>
        </section>
        <section className={cs.section}>
          <h3 className={cs.title}>Learn more about AMR in our Help Center </h3>
          <h5 className={cs.subtitle}>
            We&apos;ll show you how our pipeline works, what each of the output
            files is used for, and give tips on how to analyze your samples.
          </h5>
          <Button
            sdsStyle="rounded"
            sdsType="secondary"
            onClick={() => {
              openUrl(AMR_HELP_LINK);
              trackEvent("AmrView_docs-button_clicked", {
                sampleId: sample.id,
              });
            }}
          >
            View Help Docs
          </Button>
        </section>
      </main>
    );
  };
  return (
    <SampleReportContent
      renderResults={renderResults}
      loadingResults={loadingResults}
      workflowRun={workflowRun}
      sample={sample}
      loadingInfo={{
        message: "Your antimicrobial resistance results are being generated!",
        linkText: "Learn More about our antimicrobial resistance pipeline",
        helpLink: "https://help.czid.org",
      }}
      eventNames={{
        error: "AmrView_sample-error-info-link_clicked",
        loading: "AmrView_amr-doc-link_clicked",
      }}
    />
  );
};

export default AmrView;
