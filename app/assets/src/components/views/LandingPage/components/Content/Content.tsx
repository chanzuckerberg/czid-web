import { Link } from "@czi-sds/components";
import React from "react";
import CtaButton from "~/components/views/LandingPage/components/Content/components/CtaButton";
import RunPipelineIcon from "~/images/landing_page/run-pipeline-icon.png";
import UploadSamplesIcon from "~/images/landing_page/upload-samples-icon.png";
import ViewReportIcon from "~/images/landing_page/view-report-icon.png";
import VisualizeDataIcon from "~/images/landing_page/visualize-data-icon.png";
import { HeroEmailForm } from "../HeroEmailForm";
import KniAccordion from "./components/Accordion";
import MediaBlock from "./components/MediaBlock";
import PartnersSection from "./components/PartnersSection";
import PipelineSection from "./components/PipelineSection";
import { News, Publications } from "./components/PublicationsAndNews";
import PublicationStyles from "./components/PublicationsAndNews.scss";
import VisualizationsSection from "./components/VisualizationsSection";
import WhitePaper from "./components/WhitePaper";
import WhitePaperStyles from "./components/WhitePaper.scss";
import cs from "./Content.scss";

export const Content = () => {
  return (
    <div className={cs.contentContainer}>
      <PipelineSection />
      <section className={cs.howItWorks}>
        <h2>Get Started with 4 Simple Steps</h2>
        <p>
          All you need is a laptop and an internet connection to analyze your
          data.
        </p>

        <div className={cs.howItWorksProcess}>
          <div className={cs.howItWorksProcessStep}>
            <img src={UploadSamplesIcon} alt="" />
            <h3>Upload Samples</h3>
            <p>We accept raw sequencing data from Illumina and Nanopore</p>
          </div>
          <div className={cs.howItWorksSeparator}></div>
          <div className={cs.howItWorksProcessStep}>
            <img src={RunPipelineIcon} alt="" />
            <h3>Run Pipeline</h3>
            <p>
              Samples run concurrently in the cloud through our automated
              pipeline
            </p>
          </div>
          <div className={cs.howItWorksSeparator}></div>
          <div className={cs.howItWorksProcessStep}>
            <img src={ViewReportIcon} alt="" />
            <h3>View Report</h3>
            <p>
              Our report page provides insights and key metrics necessary for
              your analysis
            </p>
          </div>
          <div className={cs.howItWorksSeparator}></div>
          <div className={cs.howItWorksProcessStep}>
            <img src={VisualizeDataIcon} alt="" />
            <h3>Visualize Data</h3>
            <p>
              Create heatmaps and quality control charts to help draw
              conclusions across samples
            </p>
          </div>
        </div>
      </section>

      <MediaBlock />

      <VisualizationsSection />

      <PartnersSection />

      <section className={WhitePaperStyles.whitePaper}>
        <WhitePaper />
      </section>

      <section className={PublicationStyles.publicationsAndNews}>
        <Publications />
        <News />
      </section>

      <section className={cs.questions}>
        <h2>Frequently Asked Questions</h2>
        <KniAccordion />
        <CtaButton
          text="View All Questions"
          linkUrl="https://czid.org/faqs"
          aria-label="View the CZ ID FAQ page (opens in new window)"
        />
      </section>

      <section className={cs.bottomEmailForm}>
        <h2>Get started analyzing your genomic data today.</h2>
        <HeroEmailForm />
        <div className={cs.finePrint}>
          {'By clicking "Register Now," you agree to our '}
          <Link href="/terms">Terms</Link>
          {" and "}
          <Link href="/privacy">Privacy Policy</Link>
          {"."}
        </div>
      </section>
    </div>
  );
};
