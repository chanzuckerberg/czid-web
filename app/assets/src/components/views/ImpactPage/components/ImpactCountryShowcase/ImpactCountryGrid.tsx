import React from "react";
import cs from "./ImpactCountryGrid.scss";

const ImpactCountryGrid = () => {
  return (
    <div className={cs.countryGridContainer}>
      <div className={cs.countryGridContainerInner}>
        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Brazil</h3>
          <p>
            Setting up an early surveillance system for new infectious diseases
            in Brazil&mdash;before they become outbreaks.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Malawi</h3>
          <p>
            Following infectious disease doctors in Malawi to see how they are
            improving the diagnosis of sepsis in infants.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Pakistan</h3>
          <p>
            Identifying bacterial causes of neonatal deaths and any potential
            antibiotic resistance in Pakistan.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Cambodia</h3>
          <p>
            Understanding how disease spreads from mosquitoes to humans in
            Cambodia.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>The Gambia</h3>
          <p>
            Identifying resistant pathogens, particularly ones causing
            meningitis, in young children in The Gambia.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Kenya</h3>
          <p>
            Identifying the most common pathogens that are causing sickness and
            death among malnourished children in Kenya.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Nepal</h3>
          <p>
            Identifying the cause of an outbreak of encephalitis in Nepal, with
            the hope of identifying a potential vaccine for treatment.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Vietnam</h3>
          <p>
            Identifying the viral causes of childhood encephalitis in Vietnam.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>South Africa</h3>
          <p>
            Identifying the underlying cause of stillbirths and neonatal deaths
            in South Africa
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Madagascar</h3>
          <p>
            Examining fruit bats in Madagascar as a potential host for emerging
            infectious diseases, including ebola.
          </p>
        </div>

        <div className={cs.gridItem}>
          <span className={cs.gridItemLine}></span>
          <h3>Bangladesh</h3>
          <p>
            The tool was tested at a clinic in Dhaka, Bangladesh, where it
            helped discover that an outbreak of meningitis in children was
            caused by an epidemic of Chikungunya.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactCountryGrid;
