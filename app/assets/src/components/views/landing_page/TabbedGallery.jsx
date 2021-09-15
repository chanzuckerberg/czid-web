import React, { useState } from "react";
import PipelineImg from "~/images/landing_page/pipeline-image.svg";
import cs from "./TabbedGallery.scss";
import "./transitions.css";
import TabbedGalleryTab from "./TabbedGalleryTab";

const TabbedGallery = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className={`${cs.tabbedGalleryContainer} tabbedGalleryContainer`}>
      <div>
        <TabbedGalleryTab
          tabTitle="Push button pipelines & results"
          tabDescription="Discover potentially infectious organisms with an easy-to-use GUI&#8212;no coding required."
          activeClass={activeTab === 0 ? "active" : ""}
          onClick={() => {
            setActiveTab(0);
          }}
        />
        <TabbedGalleryTab
          tabTitle="Global pathogen datasets"
          tabDescription="Explore datasets from researchers across the globe."
          activeClass={activeTab === 1 ? "active" : ""}
          onClick={() => {
            setActiveTab(1);
          }}
        />
        <TabbedGalleryTab
          tabTitle="Downstream Visualizations"
          tabDescription="Visualize your samples in aggregate using the heatmap and phylogenetic tree modules."
          activeClass={activeTab === 2 ? "active" : ""}
          onClick={() => {
            setActiveTab(2);
          }}
        />
        <TabbedGalleryTab
          tabTitle="SARS-CoV-2 Support"
          tabDescription="Use our new pipeline to generate SARS-CoV-2 consensus genomes and QC in Nextclade."
          activeClass={activeTab === 3 ? "active" : ""}
          onClick={() => {
            setActiveTab(3);
          }}
        />
      </div>
      <figure>
        {activeTab === 0 ? (
          <img className="fadeUp" src={PipelineImg} alt="" />
        ) : null}
        {activeTab === 1 ? (
          <img className="fadeUp" src={PipelineImg} alt="" />
        ) : null}
        {activeTab === 2 ? (
          <img className="fadeUp" src={PipelineImg} alt="" />
        ) : null}
        {activeTab === 3 ? (
          <img className="fadeUp" src={PipelineImg} alt="" />
        ) : null}
      </figure>
    </section>
  );
};

export default TabbedGallery;
