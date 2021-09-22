import React from "react";
import IconAnalyzeFigure from "~/components/ui/icons/IconAnalyzeFigure";
import IconMatchesFigure from "~/components/ui/icons/IconMatchesFigure";
import IconSampleFigure from "~/components/ui/icons/IconSampleFigure";
import IconUploadFigure from "~/components/ui/icons/IconUploadFigure";
import CtaButton from "~/components/views/landing_page/CtaButton";
import HealthQuestionsFigure from "~/images/landing_page/health-questions-figure.svg";
import HealthQuestionsMobileFigure from "~/images/landing_page/health-questions-mobile.svg";
import LaptopImg from "~/images/landing_page/idseq-laptop.svg";
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
            the state of pathogens in a given set of samples. This allows
            scientists to make data-driven decisions about when to deploy
            antibiotics, where to prioritize immunization campaigns, how to
            shape vector-borne disease surveillance and control efforts, and
            more.
          </p>
          <CtaButton 
            text="See it in action" 
            linkUrl="https://public.idseq.net/"
            />
        </div>
        <div className={cs.summaryImage}>
          <img src={LaptopImg} alt="" />
        </div>
      </section>
      <section className={cs.healthQuestions}>
        <h2>Investigate the world&apos;s biggest health questions</h2>
        <figure>
          <img className={cs.healthQuestionsFigure} src={HealthQuestionsFigure} alt="" />
          <img className={cs.healthQuestionsMobileFigure} src={HealthQuestionsMobileFigure} alt="" />
        </figure>
      </section>

      <QuoteSlider />

      <section className={cs.howItWorks}>
        <h2>How It Works</h2>
        <p>
          Finding out what&apos;s in your sample is as easy as uploading your
          data to IDseq and clicking a button. Our pipeline immediately gets to
          work in the cloud, delivering you results in hours, not days.
        </p>

        <div className={cs.howItWorksProcess}>
          <div className={cs.howItWorksProcessStep}>
            <IconUploadFigure />
            <h3>Upload</h3>
            <p>
              Upload FASTA/FASTQ files from your computer, or import from Illumina&apos;s Basespace.
            </p>
          </div>
          <div className={cs.howItWorksSeparator}></div>
          <div className={cs.howItWorksProcessStep}>
            <IconMatchesFigure />
            <h3>Find matches in NCBI</h3>
            <p>
              The pipeline searches against the nucleotide and protein databases
              in NCBI for plant viruses, parasitic worms, bacteria, etc.
            </p>
          </div>
          <div className={cs.howItWorksSeparator}></div>
          <div className={cs.howItWorksProcessStep}>
            <IconSampleFigure />
            <h3>View Per-Sample Taxon Counts</h3>
            <p>
              Check out the auto-generated results page to see the microorganisms found in each sample.
            </p>
          </div>
          <div className={cs.howItWorksSeparator}></div>
          <div className={cs.howItWorksProcessStep}>
            <IconAnalyzeFigure />
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
        <CtaButton 
          text="View All Questions" 
          linkUrl="https://idseq.net/faqs"
          />
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
