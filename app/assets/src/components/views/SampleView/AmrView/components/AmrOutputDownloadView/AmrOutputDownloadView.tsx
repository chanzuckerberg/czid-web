/* eslint-disable import/order */
import React from "react";
import { Button, Icon, List, ListItem, ListSubheader } from "czifui";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import cs from "./amr_output_download_view.scss";
import { openUrl } from "~/components/utils/links";
import { trackEvent } from "~/api/analytics";
import { getWorkflowRunZipLink } from "../../../../report/utils/download";
import Sample, { WorkflowRun } from "~/interface/sample";
import { AMR_HELP_LINK } from "~/components/utils/documentationLinks";

interface AmrOutputDownloadViewProps {
  workflowRun: WorkflowRun;
  sample: Sample;
}

export const AmrOutputDownloadView = ({
  workflowRun,
  sample,
}: AmrOutputDownloadViewProps) => {
  const listItems = [
    ["Primary AMR Report", "final_reports/primary_AMR_report.tsv"],
    [
      "Comprehensive AMR Metrics",
      "final_reports/comprehensive_AMR_metrics.tsv",
    ],
    ["Contigs", "contigs.fa"],
    ["Non host reads", "non_host_reads.fa"],
    ["Raw outputs from CARD RGI", "raw_reports/"],
    ["Intermediate files", "intermediate_files/"],
  ];

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
            subheader={<ListSubheader>This is what you’ll get:</ListSubheader>}
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
