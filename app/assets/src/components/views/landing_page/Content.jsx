import React from "react";
import IconAnalyzeFigure from "~/components/ui/icons/IconAnalyzeFigure";
import IconMatchesFigure from "~/components/ui/icons/IconMatchesFigure";
import IconSampleFigure from "~/components/ui/icons/IconSampleFigure";
import IconUploadFigure from "~/components/ui/icons/IconUploadFigure";
import CtaButton from "~/components/views/landing_page/CtaButton";
import HealthQuestionsFigure from "~/images/landing_page/health-questions-figure.svg";
import HealthQuestionsMobileFigure from "~/images/landing_page/health-questions-mobile.svg";
import KniAccordion from "./Accordion";
import cs from "./Content.scss";
import LaptopRotator from "./LaptopRotator";
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
          {/* <img src={LaptopImg} alt="" /> */}
          <LaptopRotator />
        </div>
      </section>
      <section className={cs.healthQuestions}>
        <h2>Investigate the world&apos;s biggest health questions</h2>
        <figure>
          <img className={cs.healthQuestionsFigure} src={HealthQuestionsFigure} alt="" />
          <img className={cs.healthQuestionsMobileFigure} src={HealthQuestionsMobileFigure} alt="" />
        </figure>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .slick-dots{position:absolute;bottom:15px;display:block;width:100%;padding:0;margin:0;list-style:none;text-align:center}@media (max-width:768px){.slick-dots{bottom:12px}}.slick-dots li{position:relative;display:inline-block;width:20px;height:20px;padding:0;cursor:pointer;margin:0!important}.slick-dots li button{font-size:0;line-height:0;display:block;width:20px;height:20px;padding:5px;cursor:pointer;color:transparent;border:0;outline:0;background:0 0}.slick-dots li button:focus,.slick-dots li button:hover{outline:0}.slick-dots li button:focus:before,.slick-dots li button:hover:before{opacity:1!important;color:#fff!important}.slick-dots li button:before{font-family:slick;font-size:10px!important;line-height:20px;position:absolute;top:0;left:0;width:20px;height:20px;content:"•";text-align:center;opacity:.4!important;color:#000!important;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.slick-dots li.slick-active button:before{opacity:1!important;color:#fff!important}
      `}} />
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
