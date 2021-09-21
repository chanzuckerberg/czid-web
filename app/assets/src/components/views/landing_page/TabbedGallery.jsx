import React, { useState } from "react";
import PipelineImg2x from "~/images/landing_page/pipeline-image-2x.png";
import PipelineImg1x from "~/images/landing_page/pipeline-image.png";
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
        {activeTab === 0 ? (
          <img 
            className={`${cs.fadeUp} ${cs.mobileGalleryImage}`} 
            src={PipelineImg1x} 
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
        <TabbedGalleryTab
          tabTitle="Global pathogen datasets"
          tabDescription="Explore datasets from researchers across the globe."
          activeClass={activeTab === 1 ? "active" : ""}
          onClick={() => {
            setActiveTab(1);
          }}
        />
        {activeTab === 1 ? (
          <img 
            className={`${cs.fadeUp} ${cs.mobileGalleryImage}`} 
            src={PipelineImg1x} 
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
        <TabbedGalleryTab
          tabTitle="Downstream Visualizations"
          tabDescription="Visualize your samples in aggregate using the heatmap and phylogenetic tree modules."
          activeClass={activeTab === 2 ? "active" : ""}
          onClick={() => {
            setActiveTab(2);
          }}
        />
        {activeTab === 2 ? (
          <img 
            className={`${cs.fadeUp} ${cs.mobileGalleryImage}`} 
            src={PipelineImg1x} 
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
        <TabbedGalleryTab
          tabTitle="SARS-CoV-2 Support"
          tabDescription="Use our new pipeline to generate SARS-CoV-2 consensus genomes and QC in Nextclade."
          activeClass={activeTab === 3 ? "active" : ""}
          onClick={() => {
            setActiveTab(3);
          }}
        />
        {activeTab === 3 ? (
          <img 
            className={`${cs.fadeUp} ${cs.mobileGalleryImage}`} 
            src={PipelineImg1x} 
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
      </div>
      <div className={cs.galleryImage}>
        {activeTab === 0 ? (
          <img 
            className={cs.fadeUp} 
            src={PipelineImg1x}
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
        {activeTab === 1 ? (
          <img 
            className={cs.fadeUp} 
            src={PipelineImg1x}
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
        {activeTab === 2 ? (
          <img 
            className={cs.fadeUp} 
            src={PipelineImg1x}
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
        {activeTab === 3 ? (
          <img 
            className={cs.fadeUp} 
            src={PipelineImg1x}
            srcSet={`${PipelineImg1x}, ${PipelineImg2x} 2x`}
            alt="" 
            />
        ) : null}
      </div>
    </section>
  );
};

export default TabbedGallery;
