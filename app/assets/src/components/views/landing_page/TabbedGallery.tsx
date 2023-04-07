import React, { useState } from "react";
import GlobalMobileImg1x from "~/images/landing_page/datasets-mobile-screenshot-1x.png";
import GlobalMobileImg2x from "~/images/landing_page/datasets-mobile-screenshot-2x.png";
import GlobalDatasetsImg1x from "~/images/landing_page/datasets-screenshot-1x.png";
import GlobalDatasetsImg2x from "~/images/landing_page/datasets-screenshot-2x.png";
import HeatmapMobileImg1x from "~/images/landing_page/heatmap-mobile-screenshot-1x.png";
import HeatmapMobileImg2x from "~/images/landing_page/heatmap-mobile-screenshot-2x.png";
import HeatmapImg1x from "~/images/landing_page/heatmap-screenshot-1x.png";
import HeatmapImg2x from "~/images/landing_page/heatmap-screenshot-2x.png";
import PipelineMobileImg1x from "~/images/landing_page/pipeline-mobile-screenshot-1x.png";
import PipelineMobileImg2x from "~/images/landing_page/pipeline-mobile-screenshot-2x.png";
import PipelineImg1x from "~/images/landing_page/pipeline-screenshot-1x.png";
import PipelineImg2x from "~/images/landing_page/pipeline-screenshot-2x.png";
import SarsMobileImg1x from "~/images/landing_page/sars-mobile-screenshot-1x.png";
import SarsMobileImg2x from "~/images/landing_page/sars-mobile-screenshot-2x.png";
import SarsImg1x from "~/images/landing_page/sars-screenshot-1x.png";
import SarsImg2x from "~/images/landing_page/sars-screenshot-2x.png";
import cs from "./TabbedGallery.scss";
import TabbedGalleryTab from "./TabbedGalleryTab";
import "./transitions.css";

const TabbedGallery = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className={`${cs.tabbedGalleryContainer} tabbedGalleryContainer`}>
      <div className={cs.tabContainer}>
        <TabbedGalleryTab
          tabTitle="Push button pipelines & results"
          tabDescription="Discover potentially infectious organisms with an easy-to-use GUI&#8212;no coding required."
          activeClass={activeTab === 0 ? "active" : ""}
          onClick={() => {
            setActiveTab(0);
          }}
        />
        <img
          className={`${cs.mobileGalleryImage} ${
            activeTab === 0 ? cs.fadeUp : cs.hideImage
          }`}
          src={PipelineMobileImg1x}
          srcSet={`${PipelineMobileImg1x}, ${PipelineMobileImg2x} 2x`}
          alt=""
        />
        <TabbedGalleryTab
          tabTitle="Global pathogen datasets"
          tabDescription="Explore datasets from researchers across the globe."
          activeClass={activeTab === 1 ? "active" : ""}
          onClick={() => {
            setActiveTab(1);
          }}
        />
        <img
          className={`${cs.mobileGalleryImage} ${
            activeTab === 1 ? cs.fadeUp : cs.hideImage
          }`}
          src={GlobalMobileImg1x}
          srcSet={`${GlobalMobileImg1x}, ${GlobalMobileImg2x} 2x`}
          alt=""
        />
        <TabbedGalleryTab
          tabTitle="Downstream visualizations"
          tabDescription="Visualize your samples in aggregate using the heatmap and phylogenetic tree modules."
          activeClass={activeTab === 2 ? "active" : ""}
          onClick={() => {
            setActiveTab(2);
          }}
        />
        <img
          className={`${cs.mobileGalleryImage} ${
            activeTab === 2 ? cs.fadeUp : cs.hideImage
          }`}
          src={HeatmapMobileImg1x}
          srcSet={`${HeatmapMobileImg1x}, ${HeatmapMobileImg2x} 2x`}
          alt=""
        />
        <TabbedGalleryTab
          tabTitle="SARS-CoV-2 support"
          tabDescription="Use our new pipeline to generate SARS-CoV-2 consensus genomes and QC in Nextclade."
          activeClass={activeTab === 3 ? "active" : ""}
          onClick={() => {
            setActiveTab(3);
          }}
        />
        <img
          className={`${cs.mobileGalleryImage} ${
            activeTab === 3 ? cs.fadeUp : cs.hideImage
          }`}
          src={SarsMobileImg1x}
          srcSet={`${SarsMobileImg1x}, ${SarsMobileImg2x} 2x`}
          alt=""
        />
      </div>
      <div className={cs.galleryImage}>
        <img
          className={activeTab === 0 ? cs.fadeUp : cs.hideImage}
          src={PipelineImg1x}
          srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
          alt=""
        />
        <img
          className={activeTab === 1 ? cs.fadeUp : cs.hideImage}
          src={GlobalDatasetsImg1x}
          srcSet={`${GlobalDatasetsImg1x}, ${GlobalDatasetsImg2x} 2x`}
          alt=""
        />
        <img
          className={activeTab === 2 ? cs.fadeUp : cs.hideImage}
          src={HeatmapImg1x}
          srcSet={`${HeatmapImg1x}, ${HeatmapImg2x} 2x`}
          alt=""
        />
        <img
          className={activeTab === 3 ? cs.fadeUp : cs.hideImage}
          src={SarsImg1x}
          srcSet={`${SarsImg1x}, ${SarsImg2x} 2x`}
          alt=""
        />
      </div>
    </section>
  );
};

export default TabbedGallery;
