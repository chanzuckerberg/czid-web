import React, { useState } from "react";
import CoverageVizImage from "~/images/landing_page/cov-visualization.png";
import HeatmapImage from "~/images/landing_page/heatmap.png";
import PhylotreeImage from "~/images/landing_page/phylotree.png";
import TaxTreeImage from "~/images/landing_page/taxonomic-tree.png";
import cs from "./VisualizationsSection.scss";

const VisualizationsSection = () => {
  const PlusIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="10.3881"
        cy="10.239"
        r="9.01565"
        stroke="#999999"
        strokeWidth="0.968695"
      />
      <path
        d="M10.3877 5.59192V14.8863"
        stroke="#999999"
        strokeWidth="0.968695"
      />
      <path
        d="M5.74091 10.2391L15.0353 10.2391"
        stroke="#999999"
        strokeWidth="0.968695"
      />
    </svg>
  );

  const MinusIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10.1605" cy="9.60571" r="9.5" fill="#CCCCCC" />
      <path
        d="M5.51343 9.60535L14.8078 9.60535"
        stroke="white"
        strokeWidth="0.968695"
      />
    </svg>
  );

  const SECTIONS = {
    HEATMAP: 0,
    COVERAGE_VISUALIZATION: 1,
    TAXONOMIC_TREE: 2,
    PHYLOGENETIC_TREE: 3,
  };

  const [selectedSection, setSelectedSection] = useState(SECTIONS.HEATMAP);

  return (
    <section className={cs.visualizationsSection}>
      <h2>Powerful, Customizable Data Visualizations</h2>

      <div className={cs.visualizationsSection__desktop}>
        <div
          className={cs.visualizationsSection__imageContainer_wrap}
          style={{
            borderRadius: `${
              selectedSection === SECTIONS.HEATMAP
                ? "5px 5px 5px 0px"
                : selectedSection === SECTIONS.PHYLOGENETIC_TREE
                ? "5px 5px 0px 5px"
                : "5px"
            }`,
          }}
        >
          <div className={cs.visualizationsSection__imageContainer}>
            <img
              style={{ opacity: selectedSection === SECTIONS.HEATMAP ? 1 : 0 }}
              src={HeatmapImage}
              alt=""
            />
            <img
              style={{
                opacity:
                  selectedSection === SECTIONS.COVERAGE_VISUALIZATION ? 1 : 0,
              }}
              src={CoverageVizImage}
              alt=""
            />
            <img
              style={{
                opacity: selectedSection === SECTIONS.TAXONOMIC_TREE ? 1 : 0,
              }}
              src={TaxTreeImage}
              alt=""
            />
            <img
              style={{
                opacity: selectedSection === SECTIONS.PHYLOGENETIC_TREE ? 1 : 0,
              }}
              src={PhylotreeImage}
              alt=""
            />
          </div>
        </div>

        <div className={cs.visualizationsSection__selectionRow}>
          <div
            className={`${cs.visualizationsSection__selectionRow_item} ${
              selectedSection === SECTIONS.HEATMAP ? cs.active : ""
            }`}
            onClick={() => setSelectedSection(SECTIONS.HEATMAP)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedSection(SECTIONS.HEATMAP);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <h3
              className={selectedSection === SECTIONS.HEATMAP ? cs.active : ""}
            >
              Heatmap
            </h3>
            <p>Customize the heatmap to answer your research questions</p>
          </div>
          <div
            className={`${cs.visualizationsSection__selectionRow_item} ${
              selectedSection === SECTIONS.COVERAGE_VISUALIZATION
                ? cs.active
                : ""
            }`}
            onClick={() => setSelectedSection(SECTIONS.COVERAGE_VISUALIZATION)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedSection(SECTIONS.COVERAGE_VISUALIZATION);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <h3
              className={
                selectedSection === SECTIONS.COVERAGE_VISUALIZATION
                  ? cs.active
                  : ""
              }
            >
              Coverage Visualization
            </h3>
            <p>Check out the coverage breadth and depth for taxa of interest</p>
          </div>
          <div
            className={`${cs.visualizationsSection__selectionRow_item} ${
              selectedSection === SECTIONS.TAXONOMIC_TREE ? cs.active : ""
            }`}
            onClick={() => setSelectedSection(SECTIONS.TAXONOMIC_TREE)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedSection(SECTIONS.TAXONOMIC_TREE);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <h3
              className={
                selectedSection === SECTIONS.TAXONOMIC_TREE ? cs.active : ""
              }
            >
              Taxonomic Tree
            </h3>
            <p>View a phylogram of your sample’s microbes</p>
          </div>
          <div
            className={`${cs.visualizationsSection__selectionRow_item} ${
              selectedSection === SECTIONS.PHYLOGENETIC_TREE ? cs.active : ""
            }`}
            onClick={() => setSelectedSection(SECTIONS.PHYLOGENETIC_TREE)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSelectedSection(SECTIONS.PHYLOGENETIC_TREE);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <h3
              className={
                selectedSection === SECTIONS.PHYLOGENETIC_TREE ? cs.active : ""
              }
            >
              Phylogenetic Tree
            </h3>
            <p>Evaluate sequence similarity to identify potential outbreaks</p>
          </div>
        </div>
      </div>

      <div className={cs.visualizationsSection__mobile}>
        <div
          className={cs.visualizationsSection__mobile_item}
          onClick={() => {
            setSelectedSection(SECTIONS.HEATMAP);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              setSelectedSection(SECTIONS.HEATMAP);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={cs.visualizationsSection__mobile_titleContainer}>
            <h3
              className={selectedSection === SECTIONS.HEATMAP ? cs.active : ""}
            >
              Heatmap
            </h3>
            {selectedSection === SECTIONS.HEATMAP ? (
              <MinusIcon />
            ) : (
              <PlusIcon />
            )}
          </div>
          <p>Customize the heatmap to answer research questions</p>
          <img
            className={selectedSection === SECTIONS.HEATMAP ? cs.active : ""}
            style={{ opacity: selectedSection === SECTIONS.HEATMAP ? 1 : 0 }}
            src={HeatmapImage}
            alt=""
          />
        </div>
        <div
          className={cs.visualizationsSection__mobile_item}
          onClick={() => {
            setSelectedSection(SECTIONS.COVERAGE_VISUALIZATION);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              setSelectedSection(SECTIONS.COVERAGE_VISUALIZATION);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={cs.visualizationsSection__mobile_titleContainer}>
            <h3
              className={
                selectedSection === SECTIONS.COVERAGE_VISUALIZATION
                  ? cs.active
                  : ""
              }
            >
              Coverage Visualization
            </h3>
            {selectedSection === SECTIONS.COVERAGE_VISUALIZATION ? (
              <MinusIcon />
            ) : (
              <PlusIcon />
            )}
          </div>
          <p>Check out the coverage breadth and depth for taxon hits</p>
          <img
            className={
              selectedSection === SECTIONS.COVERAGE_VISUALIZATION
                ? cs.active
                : ""
            }
            style={{
              opacity:
                selectedSection === SECTIONS.COVERAGE_VISUALIZATION ? 1 : 0,
            }}
            src={CoverageVizImage}
            alt=""
          />
        </div>
        <div
          className={cs.visualizationsSection__mobile_item}
          onClick={() => {
            setSelectedSection(SECTIONS.TAXONOMIC_TREE);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              setSelectedSection(SECTIONS.TAXONOMIC_TREE);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={cs.visualizationsSection__mobile_titleContainer}>
            <h3
              className={
                selectedSection === SECTIONS.TAXONOMIC_TREE ? cs.active : ""
              }
            >
              Taxonomic Tree
            </h3>
            {selectedSection === SECTIONS.TAXONOMIC_TREE ? (
              <MinusIcon />
            ) : (
              <PlusIcon />
            )}
          </div>
          <p>View a phylogram of your samples microbes</p>
          <img
            className={
              selectedSection === SECTIONS.TAXONOMIC_TREE ? cs.active : ""
            }
            style={{
              opacity: selectedSection === SECTIONS.TAXONOMIC_TREE ? 1 : 0,
            }}
            src={TaxTreeImage}
            alt=""
          />
        </div>
        <div
          className={cs.visualizationsSection__mobile_item}
          onClick={() => {
            setSelectedSection(SECTIONS.PHYLOGENETIC_TREE);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              setSelectedSection(SECTIONS.PHYLOGENETIC_TREE);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={cs.visualizationsSection__mobile_titleContainer}>
            <h3
              className={
                selectedSection === SECTIONS.PHYLOGENETIC_TREE ? cs.active : ""
              }
            >
              Phylogenetic Tree
            </h3>
            {selectedSection === SECTIONS.PHYLOGENETIC_TREE ? (
              <MinusIcon />
            ) : (
              <PlusIcon />
            )}
          </div>
          <p>Evaluate sequence similarity to identify potential outbreaks</p>
          <img
            className={
              selectedSection === SECTIONS.PHYLOGENETIC_TREE ? cs.active : ""
            }
            style={{
              opacity: selectedSection === SECTIONS.PHYLOGENETIC_TREE ? 1 : 0,
            }}
            src={PhylotreeImage}
            alt=""
          />
        </div>
      </div>
    </section>
  );
};

export default VisualizationsSection;
