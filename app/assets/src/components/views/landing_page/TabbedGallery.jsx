import React, { useState } from "react";
import GlobalDatasetsImg1x from "~/images/landing_page/global-datasets-1x.png";
import GlobalDatasetsImg2x from "~/images/landing_page/global-datasets-2x.png";
import HeatmapImg1x from "~/images/landing_page/heatmap-1x.png";
import HeatmapImg2x from "~/images/landing_page/heatmap-2x.png";
import PipelineImg1x from "~/images/landing_page/pipeline-visualization-1x.png";
import PipelineImg2x from "~/images/landing_page/pipeline-visualization-2x.png";



import SarsImg1x from "~/images/landing_page/sars-cov-2-1x.png";
import SarsImg2x from "~/images/landing_page/sars-cov-2-2x.png";

import cs from "./TabbedGallery.scss";
import "./transitions.css";
import TabbedGalleryTab from "./TabbedGalleryTab";

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
          className={`${cs.mobileGalleryImage} ${activeTab === 0 ? cs.fadeUp : cs.hideImage}`}
          src={PipelineImg1x} 
          srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
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
          className={`${cs.mobileGalleryImage} ${activeTab === 1 ? cs.fadeUp : cs.hideImage}`}
          src={GlobalDatasetsImg1x} 
          srcSet={`${GlobalDatasetsImg1x}, ${GlobalDatasetsImg2x} 2x`}
          alt="" 
          />
        <TabbedGalleryTab
          tabTitle="Downstream Visualizations"
          tabDescription="Visualize your samples in aggregate using the heatmap and phylogenetic tree modules."
          activeClass={activeTab === 2 ? "active" : ""}
          onClick={() => {
            setActiveTab(2);
          }}
        />
        <img 
          className={`${cs.mobileGalleryImage} ${activeTab === 2 ? cs.fadeUp : cs.hideImage}`}
          src={HeatmapImg1x} 
          srcSet={`${HeatmapImg1x}, ${HeatmapImg2x} 2x`}
          alt="" 
          />
        <TabbedGalleryTab
          tabTitle="SARS-CoV-2 Support"
          tabDescription="Use our new pipeline to generate SARS-CoV-2 consensus genomes and QC in Nextclade."
          activeClass={activeTab === 3 ? "active" : ""}
          onClick={() => {
            setActiveTab(3);
          }}
        />
        <img 
          className={`${cs.mobileGalleryImage} ${activeTab === 3 ? cs.fadeUp : cs.hideImage}`} 
          src={SarsImg1x} 
          srcSet={`${SarsImg1x}, ${SarsImg2x} 2x`}
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
