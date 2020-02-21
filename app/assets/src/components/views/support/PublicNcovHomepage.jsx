import React from "react";

import { NarrowContainer } from "~/components/layout";
import NextActionButton from "~/components/ui/controls/buttons/NextActionButton";
import { UserContext } from "~/components/common/UserContext";
import { logAnalyticsEvent } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";

import cs from "./support.scss";

export default class PublicNcovHomepage extends React.Component {
  render() {
    const { appConfig } = this.context || {};

    const VIEW_SAMPLES_LINK =
      `public?projectId=${
        appConfig.publicNcovProjectId
      }&currentDisplay=table&currentTab=samples&` +
      `sampleActiveColumns=%5B"sample"%2C"createdAt"%2C"host"%2C"collectionLocationV2"%2C"sampleType"%2C"totalReads"%2C"nonHostReads"%2C"qcPercent"%5D&showFilters=true&showStats=true`;

    const INDEX_CASE_LINK_1 = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicIndexCaseUrl}
        onClick={() =>
          logAnalyticsEvent("PublicNCovHomePage_index-case-link-one_clicked")
        }
      >
        Index Case sample (Patient 1)
      </ExternalLink>
    );

    const INDEX_CASE_LINK_2 = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicIndexCaseUrl}
        onClick={() =>
          logAnalyticsEvent("PublicNCovHomePage_index-case-link-two_clicked")
        }
      >
        sample
      </ExternalLink>
    );

    // TODO(mark): Look into opening up coverage viz when page loads if high-priority.
    /*
    const INDEX_CASE_COVERAGE_VIZ_LINK = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicIndexCaseUrlWithCoverageViz}
        onClick={() => logAnalyticsEvent("PublicNCovHomePage_index-case-coverage-viz-link_clicked")}
      >
        MN988558.1
      </ExternalLink>
    )
    */

    const FAMILY_ONE_LINK = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicFamily1Url}
        onClick={() =>
          logAnalyticsEvent("PublicNCovHomePage_family-one-link_clicked")
        }
      >
        Family Member 1
      </ExternalLink>
    );

    const FAMILY_TWO_LINK = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicFamily2Url}
        onClick={() =>
          logAnalyticsEvent("PublicNCovHomePage_family-two-link_clicked")
        }
      >
        Family Member 2
      </ExternalLink>
    );

    const FAMILY_THREE_LINK = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicFamily3Url}
        onClick={() =>
          logAnalyticsEvent("PublicNCovHomePage_family-three-link_clicked")
        }
      >
        Family Member 3
      </ExternalLink>
    );

    const HEATMAP_LINK = (
      <ExternalLink
        className={cs.link}
        href={`visualizations/heatmap/${appConfig.publicNcovHeatmapId}`}
        onClick={() =>
          logAnalyticsEvent("PublicNCovHomePage_heatmap-link_clicked")
        }
      >
        identified several genera commonly associated with nasopharyngeal flora
      </ExternalLink>
    );

    const INDEX_CASE_RESEQUENCE_LINK = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicIndexCaseUrlResequenced}
        onClick={() =>
          logAnalyticsEvent(
            "PublicNCovHomePage_index-case-resequenced-link_clicked"
          )
        }
      >
        Re-sequencing of the initial Index Case
      </ExternalLink>
    );

    const INDEX_CASE_ENRICHMENT_LINK = (
      <ExternalLink
        className={cs.link}
        href={appConfig.publicIndexCaseUrlEnriched}
        onClick={() =>
          logAnalyticsEvent(
            "PublicNCovHomePage_index-case-enriched-link_clicked"
          )
        }
      >
        target enrichment strategy
      </ExternalLink>
    );

    return (
      <NarrowContainer className={cs.publicNcovHomepage} size="small">
        <div className={cs.title}>
          <h1>COVID-19 Cambodia Family Cluster</h1>
          <div className={cs.fill} />
          <a href={VIEW_SAMPLES_LINK}>
            <NextActionButton
              label="View Samples"
              onClick={() =>
                logAnalyticsEvent(
                  "PublicNcovHomepage_view-samples-link_clicked"
                )
              }
            />
          </a>
        </div>
        <img className={cs.image} src="assets/wuhan_map.png" />
        <h2>Background</h2>
        <p className={cs.large}>
          Incubation periods and transmissibility of COVID-19 are questions of
          current worldwide concern, but difficult to answer given nonspecific
          symptoms that represent a variety of respiratory viruses. In this
          setting, genetic characterization of the virus from geographically
          diverse patient samples is key to infer the rate of spread. However,
          as the virus reaches resource-limited settings such as Cambodia, Laos,
          and Myanmar in close proximity to the outbreak’s epicenter, there are
          basic challenges in sample collection, contact tracing, and
          surveillance that hinder disease containment, much less the ability to
          sequence new cases in-country. Implementing in-country sequencing and
          post-sequencing data analysis speeds up the time to pathogen
          identification, giving scientists in-country the ability to inform
          leading public health officials to combat emerging infections.
        </p>
        <h2>About</h2>
        <p className={cs.large}>
          In a rapidly implemented response to the nCOV-2019 outbreak, the{" "}
          <b>NIH-CNM</b> team and Institut Pasteur used metagenomic
          next-generation sequencing (mNGS) and the IDseq bioinformatics
          platform to review the Cambodian index nCOV-2019 case and three sick
          family members, who had tested negative for nCOV-2019, in less than 48
          hours from sample receipt.
        </p>
        <p className={cs.large}>This project had 3 goals:</p>
        <ol>
          <li>
            Characterize the novel virus in addition to other potential
            pathogens circulating in the family cluster.
          </li>
          <li>
            Investigate whether mNGS could reveal etiology for the 3 symptomatic
            PCR-negative family members.
          </li>
          <li>
            Determine the full genomic sequence for immediate public use,
            comparing the sequence to existing published genomes around the
            world to understand global transmission patterns.
          </li>
        </ol>
        <h2>What were the scientists’ hypotheses?</h2>
        <ol>
          <li>
            While RT-PCR confirmed the first positive case of the novel
            coronavirus in Cambodia, mNGS may provide additional sensitivity and
            reveal etiology for symptomatic, PCR-negative, family members.
          </li>
          <li>
            Given the patient traveled directly from Wuhan to Cambodia on
            January 23, his virus should be phylogenetically similar to initial
            sequences published by Chinese researchers in Wuhan.
          </li>
        </ol>
        <h2>How was the data generated?</h2>
        <p className={cs.large}>
          Institut Pasteur Cambodia performed the RNA extraction from four
          nasopharyngeal swabs (NPS) from the index case and three symptomatic
          family members. On February 1st, the <b>NIH-CNM</b> team made
          sequencing libraries from the extracted RNA, sequenced the samples on
          an iSeq100, demultiplexed the FASTQ files, and the results of the
          sequencing run were compiled into Illumina’s Basespace. The data was
          then uploaded to IDseq and processed using the latest IDseq database -
          updated from NCBI on 2019-09-17. While the index did not contain the
          reference sequences for SARS-CoV-2, which were deposited to NCBI in
          January 2020, conclusions could still be drawn from the data. IDseq’s
          NCBI database index was updated on 2019-02-10 with the most recent
          version of NCBI that included the recently added SARS-CoV-2 sequences.
          The analysis was rerun using the new NCBI index to confirm the match
          to SARS-CoV-2 in the PCR-positive index case. Further experiments were
          done to isolate a full genome sequence for SARS-CoV-2 from the Index
          Patient.
        </p>
        <h2>What conclusions were drawn from the data?</h2>
        <ol>
          <li>
            SARS-CoV-2 was identified in the {INDEX_CASE_LINK_1}, confirming the
            PCR-positive results. Looking at the {INDEX_CASE_LINK_2} and
            pipeline run with the most recent index you can see that IDseq
            picked up 582 reads that aligned to the Wuhan seafood market
            pneumonia virus (taxID 2697049) with an average percent identity of
            100% in NT. IDseq was able to generate 26 contigs from those reads
            with 33.2% coverage of NCBI accession sequence MN985325.1.
          </li>
          <li>
            SARS-CoV-2 or similar pathogens were not found in any of the
            PCR-negative symptomatic family members ({FAMILY_ONE_LINK},{" "}
            {FAMILY_TWO_LINK}
            , {FAMILY_THREE_LINK}) This means that the mNGS results align with
            their COVID-19 PCR results.
          </li>
          <li>
            In the symptomatic, but PCR-negative family members, IDseq{" "}
            {HEATMAP_LINK} at levels significantly greater than the water
            controls, generating hypotheses regarding the origin of the
            symptoms.
          </li>
          <li>
            {INDEX_CASE_RESEQUENCE_LINK} in an attempt to obtain full genome
            coverage resulted in a greater number of reads aligning to
            SARS-CoV-2 (819 reads, 22 contigs), with limited impact on total
            coverage.
          </li>
          <li>
            By using a {INDEX_CASE_ENRICHMENT_LINK}, a full-length contig could
            be assembled with an average depth of 14.9x. The SARS-CoV-2 genome
            sequence was uploaded to the GISAID repository (accession
            EPI_ISL_411902).
          </li>
        </ol>
      </NarrowContainer>
    );
  }
}

PublicNcovHomepage.contextType = UserContext;
