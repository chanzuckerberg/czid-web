import React from "react";
import CtaButton from "~/components/views/landing_page/CtaButton";
import HealthQuestionsFigure from "~/images/landing_page/health-questions-figure.svg";
import LaptopImg from "~/images/landing_page/idseq-laptop.svg";
import VisualizeIcon from "~/images/landing_page/process-analyze.svg";
import MatchesIcon from "~/images/landing_page/process-matches.svg";
import CountsIcon from "~/images/landing_page/process-sample.svg";
import UploadIcon from "~/images/landing_page/process-upload.svg";
import KniAccordion from "./Accordion";
import cs from "./Content.scss";
import { Publications, News } from "./PublicationsAndNews";
import PublicationStyles from "./PublicationsAndNews.scss";
import QuoteSlider from "./QuoteSlider";
import TabbedGallery from "./TabbedGallery";
import WhitePaper from "./WhitePaper";
import WhitePaperStyles from "./WhitePaper.scss";

const Content = () => {
  return (
    <div className={cs.contentContainer}>
      <section className={cs.summary}>
        <div className={cs.summaryText}>
          <h2>Detect and track emerging infectious diseases worldwide</h2>
          <p>
            IDseq accepts sequencing data from researchers around the world and
            quickly processes the results to provide actionable information on
            the state of pathogens in the given set of samples. This allows
            scientists to make data-driven decisions about when to deploy
            antibiotics, where to prioritize immunization campaigns, how to
            shape vector-borne disease surveillance and control efforts, and
            more.
          </p>
          <CtaButton text="See it in action" />
        </div>
        <div className={cs.summaryImage}>
          <img src={LaptopImg} alt="" />
        </div>
      </section>
      <section className={cs.healthQuestions}>
        <h2>Investigate the world&apos;s biggest health questions</h2>
        <figure>
          <img src={HealthQuestionsFigure} alt="" />
        </figure>
      </section>

      <QuoteSlider />

      <section className={cs.howItWorks}>
        <h2>How It Works</h2>
        <p>
          Finding out what&apos;s in your sample is as easy as uploading your
          data to IDseq and clicking a button. Our pipeline immediately gets to
          work in the cloud, delivering you results in hours, not days. Take a
          look at taxon counts at the sample-level, or in aggregate with our
          suite of visualization tools.
        </p>

        <div className={cs.howItWorksProcess}>
          <div className={cs.howItWorksProcessStep}>
            <img src={UploadIcon} alt="" />
            <h3>Upload</h3>
            <p>
              Upload FASTA/FASTQ files from your computer, or use direct
              integration with Illumina&apos;s Basespace.
            </p>
          </div>

          <div className={cs.howItWorksProcessStep}>
            <img src={MatchesIcon} alt="" />
            <h3>Find matches in NCBI</h3>
            <p>
              The pipeline searches against the nucleotide and protein databases
              in the National Center for Biotechnology Information (NCBI) for
              plant viruses, parasitic worms, bacteria, etc.
            </p>
          </div>

          <div className={cs.howItWorksProcessStep}>
            <img src={CountsIcon} alt="" />
            <h3>View Per-Sample Taxon Counts</h3>
            <p>
              Our report page provides insights into all microorganisms found in
              your sample
            </p>
          </div>

          <div className={cs.howItWorksProcessStep}>
            <img src={VisualizeIcon} alt="" />
            <h3>Analyze & Visualize</h3>
            <p>
              Generate heatmaps, phylogenetic trees, or quality control charts
              to help draw conclusions across your samples.
            </p>
          </div>
        </div>
      </section>

      <section className={cs.tabbedGallery}>
        <TabbedGallery />
      </section>

      <section className={cs.questions}>
        <h2>Frequently Asked Questions</h2>
        <KniAccordion className={cs.accordion} />
        <CtaButton text="View All Questions" />
      </section>

      <section className={WhitePaperStyles.whitePaper}>
        <WhitePaper />
      </section>

      <section className={PublicationStyles.publicationsAndNews}>
        <Publications />
        <News />
      </section>
    </div>
  );
};

export default Content;
